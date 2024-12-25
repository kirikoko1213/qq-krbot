FROM alpine:3

COPY ./qq-krbot /qq-krbot

ENV chatgpt.timeout 120
ENV serve.port 10047

USER 1000

WORKDIR /

CMD "./qq-krbot"