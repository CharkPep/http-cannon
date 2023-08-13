# http-cannon

Small CLI HTTP1.1 request cannon written in one evening.

Run to get help:
```
ts-node main.ts -h
```
Example
```
ts-node main.ts -c 1000 -d 120 -t 10 example.com
```


P.s 😅Made this project a while ago, while cleaning the disk discovered it, decided it would be nice to share it. There is a lot of room for improvement:
- add workers support
- possibly change request strategy
- implement HTTPS/TLS support
