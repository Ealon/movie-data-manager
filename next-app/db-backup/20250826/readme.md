```sh
pg_dump --dbname='postgresql://** Neon Postgres Connection String ***2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' > ./db-backup/20250826/movie-db.bak
```

```sh
pg_restore --dbname="postgresql://ealon:Pswd_123\!@localhost:5432/movie-db?schema=public" ./db-backup/20250826/movie-db.bak

psql --dbname="postgresql://ealon:Pswd_123\!@localhost:5432/movie-db" < ./db-backup/20250826/movie-db.bak
```
