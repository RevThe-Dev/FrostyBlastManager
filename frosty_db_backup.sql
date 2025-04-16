--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    description text NOT NULL,
    quantity integer NOT NULL,
    unit_price double precision NOT NULL,
    total double precision NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO neondb_owner;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_id_seq OWNER TO neondb_owner;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    job_id integer NOT NULL,
    customer_id integer NOT NULL,
    amount double precision NOT NULL,
    tax double precision NOT NULL,
    total double precision NOT NULL,
    issue_date timestamp without time zone DEFAULT now() NOT NULL,
    due_date timestamp without time zone NOT NULL,
    notes text,
    payment_terms text NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by integer NOT NULL
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    job_id text NOT NULL,
    customer_id integer NOT NULL,
    title text NOT NULL,
    description text,
    location text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL,
    vehicle_make text,
    vehicle_model text,
    registration_number text
);


ALTER TABLE public.jobs OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    role text DEFAULT 'staff'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    approved boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicle_inspections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vehicle_inspections (
    id integer NOT NULL,
    job_id integer NOT NULL,
    vehicle_make text NOT NULL,
    vehicle_model text NOT NULL,
    registration_number text NOT NULL,
    mileage integer NOT NULL,
    fuel_level integer NOT NULL,
    damage_description text,
    photos jsonb,
    customer_name text NOT NULL,
    customer_signature text NOT NULL,
    inspected_by integer NOT NULL,
    inspection_date timestamp without time zone DEFAULT now() NOT NULL,
    customer_id integer
);


ALTER TABLE public.vehicle_inspections OWNER TO neondb_owner;

--
-- Name: vehicle_inspections_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.vehicle_inspections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicle_inspections_id_seq OWNER TO neondb_owner;

--
-- Name: vehicle_inspections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.vehicle_inspections_id_seq OWNED BY public.vehicle_inspections.id;


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicle_inspections id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vehicle_inspections ALTER COLUMN id SET DEFAULT nextval('public.vehicle_inspections_id_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, name, email, phone, address, notes, created_at) FROM stdin;
1	test test	test@test.com	test	test	test	2025-04-14 10:31:17.510317
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_price, total) FROM stdin;
1	1	ice	1	1200	1200
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, invoice_number, job_id, customer_id, amount, tax, total, issue_date, due_date, notes, payment_terms, payment_method, status, created_by) FROM stdin;
1	INV-202504-8988	1	1	1200	240	1440	2025-04-14 00:00:00	2025-05-14 00:00:00	Thank you for your business. Payment is due within 30 days.	30	bank-transfer	draft	6
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.jobs (id, job_id, customer_id, title, description, location, start_date, end_date, status, created_at, created_by, vehicle_make, vehicle_model, registration_number) FROM stdin;
1	JOB-6705	1	job 2	bad exhaust	home base	2025-04-14 00:00:00	2025-04-16 00:00:00	scheduled	2025-04-14 12:23:52.876856	1	\N	\N	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
rnr8c3YibzivEVFQ4d7t72kXVGzxfGhZ	{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-17T11:58:48.212Z","httpOnly":true,"path":"/"},"passport":{"user":6}}	2025-04-17 15:54:44
fcyJQv3lQ6KJ5qofZfImGSUz4xoHVqLD	{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-16T09:43:45.139Z","httpOnly":true,"path":"/"},"passport":{"user":6}}	2025-04-16 15:05:53
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, email, full_name, role, created_at, approved) FROM stdin;
6	admin	a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3.9b1118b8b7e44fa48f7816136da92685	admin@frostys.com	Administrator	admin	2025-04-14 19:09:31.498124	t
1	Frostys	password	Frostysiceblasting@outlook.com	Liam Sandgren	admin	2025-04-14 09:17:49.791262	t
7	Adam	c0c3810b23466b4caa6ba372fbd97b872e0940bbee721a33fc3ce5a510b23c2b360f32b4a5d9492921dac7d1e504bfe7129fd57811e85fef358a1c1698e9a6e0.2c4344094c15fc2e53309370eb5f0eef		Adam Hughes	staff	2025-04-15 09:44:17.013731	t
\.


--
-- Data for Name: vehicle_inspections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.vehicle_inspections (id, job_id, vehicle_make, vehicle_model, registration_number, mileage, fuel_level, damage_description, photos, customer_name, customer_signature, inspected_by, inspection_date, customer_id) FROM stdin;
1	1	ssssss	sssss	ab12 abs	24432	50	damaged	[]	test test	data:image/png;base64,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	1	2025-04-14 12:52:14.940487	1
\.


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 1, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: vehicle_inspections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.vehicle_inspections_id_seq', 1, true);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_job_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_job_id_unique UNIQUE (job_id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: vehicle_inspections vehicle_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vehicle_inspections
    ADD CONSTRAINT vehicle_inspections_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

