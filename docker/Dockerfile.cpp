FROM gcc:latest

WORKDIR /app

RUN useradd -m -s /bin/bash runner
USER runner

COPY --chown=runner:runner . .

RUN g++ -o main main.cpp

CMD ["./main"]