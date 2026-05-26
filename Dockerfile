FROM cgr.dev/chainguard/nginx:latest

COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

EXPOSE 8080

CMD ["-g", "daemon off;"]
