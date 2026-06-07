#!/usr/bin/env python3
import asyncio
import websockets
import json
import tempfile
import os
import sys


async def stream_output(websocket, proc, fname):
    """Read process stdout (merged stderr) and stream to WebSocket."""
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
        try:
            os.unlink(fname)
        except Exception:
            pass


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

                with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
                    f.write(code)
                    fname = f.name

                env = {**os.environ, 'PYTHONUNBUFFERED': '1'}

                try:
                    proc = await asyncio.create_subprocess_exec(
                        'python3', '-u', fname,
                        stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.STDOUT,
                        env=env
                    )
                    stream_task = asyncio.create_task(stream_output(websocket, proc, fname))
                except Exception as e:
                    await websocket.send(json.dumps({'type': 'error', 'data': f'Failed to start: {e}'}))
                    await websocket.send(json.dumps({'type': 'done', 'exit_code': -1}))
                    try:
                        os.unlink(fname)
                    except Exception:
                        pass

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
    print('Python executor starting on port 8765...', flush=True)
    async with websockets.serve(handle_client, '0.0.0.0', 8765):
        print('Python executor ready', flush=True)
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
