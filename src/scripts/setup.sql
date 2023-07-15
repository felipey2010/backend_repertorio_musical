CREATE DATABASE repertorio_musical_db;

CREATE SCHEMA IF NOT EXISTS public;

--song entity
create table if not exists public.musics (
    id serial not null constraint song_key primary key,
    title varchar(255),
    artiste varchar(150),
    category varchar(100),
    link_yt varchar(255),
    link_cifra varchar(255),
    registered_by varchar(255),
    user_id varchar(255),
    date_created timestamp
);

create table if not exists public.users (
    id varchar(255),
    username varchar(100),
    email varchar(100) UNIQUE,
    password varchar(255),
    active boolean,
    role varchar(30),
    is_logged_in boolean,
    date_registered timestamp not null,
    last_logged_in timestamp,
    last_logged_out timestamp
);
