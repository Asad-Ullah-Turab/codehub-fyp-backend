#!/usr/bin/env python3
import asyncio
import websockets
import json
import tempfile
import os
import sys
import shutil


async def stream_output(websocket, proc, tmpdir):
    """Stream process stdout to WebSocket, clean up temp dir when done."""
    try:
        while True:
            try:
                chunk = await asyncio.wait_for(proc.stdout.read(4096), timeout=30.0)
                if chunk == b'':
                    break
                await websocket.send(json.dumps({
                    'type': 'output',
                    'data': chunk.decode('utf-8', errors='replace')
                }))
            except asyncio.TimeoutError:
                proc.terminate()
                break

        await proc.wait()
        await websocket.send(json.dumps({
            'type': 'done',
            'exit_code': proc.returncode if proc.returncode is not None else -1
        }))
    except Exception as e:
        try:
            await websocket.send(json.dumps({'type': 'error', 'data': str(e)}))
        except Exception:
            pass
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def handle_client(websocket):
    proc = None
    stream_task = None

    try:
        async for raw in websocket:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get('type')

            if msg_type == 'execute':
                if proc and proc.returncode is None:
                    proc.terminate()
                if stream_task and not stream_task.done():
                    stream_task.cancel()

                code = msg.get('code', '')
                tmpdir = tempfile.mkdtemp()
                cpp_file = os.path.join(tmpdir, 'main.cpp')
                exe_file = os.path.join(tmpdir, 'main')

                with open(cpp_file, 'w') as f:
                    f.write(code)

                try:
                    # Compile
                    compile_proc = await asyncio.create_subprocess_exec(
                        'g++', '-o', exe_file, cpp_file,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    _, compile_err = await asyncio.wait_for(compile_proc.communicate(), timeout=15.0)

                    if compile_proc.returncode != 0:
                        await websocket.send(json.dumps({
                            'type': 'output',
                            'data': f'Compilation error:\n{compile_err.decode()}'
                        }))
                        await websocket.send(json.dumps({'type': 'done', 'exit_code': 1}))
                        shutil.rmtree(tmpdir, ignore_errors=True)
                        continue

                    # Run with output buffering disabled
                    proc = await asyncio.create_subprocess_exec(
                        'stdbuf', '-o0', '-e0', exe_file,
                        stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.STDOUT
                    )
                    stream_task = asyncio.create_task(stream_output(websocket, proc, tmpdir))

                except asyncio.TimeoutError:
                    await websocket.send(json.dumps({'type': 'output', 'data': 'Compilation timed out\n'}))
                    await websocket.send(json.dumps({'type': 'done', 'exit_code': 1}))
                    shutil.rmtree(tmpdir, ignore_errors=True)
                except Exception as e:
                    await websocket.send(json.dumps({'type': 'error', 'data': f'Failed to start: {e}'}))
                    await websocket.send(json.dumps({'type': 'done', 'exit_code': -1}))
                    shutil.rmtree(tmpdir, ignore_errors=True)

            elif msg_type == 'input':
                if proc and proc.returncode is None and proc.stdin:
                    try:
                        data = msg.get('data', '') + '\n'
                        proc.stdin.write(data.encode())
                        await proc.stdin.drain()
                    except Exception:
                        pass

            elif msg_type == 'stop':
                if proc and proc.returncode is None:
                    proc.terminate()
                if stream_task and not stream_task.done():
                    stream_task.cancel()

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        print(f'Handler error: {e}', file=sys.stderr, flush=True)
    finally:
        if proc and proc.returncode is None:
            proc.terminate()
        if stream_task and not stream_task.done():
            stream_task.cancel()


async def main():
    print('C++ executor starting on port 8765...', flush=True)
    async with websockets.serve(handle_client, '0.0.0.0', 8765):
        print('C++ executor ready', flush=True)
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
