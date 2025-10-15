-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;
-- Drop existing table to recreate with correct dimensions
drop table if exists documents;
-- Create a table to store your documents
create table documents (
  id bigserial primary key,
  content text,
  -- corresponds to Document.pageContent
  metadata jsonb,
  -- corresponds to Document.metadata
  embedding vector(1024) -- 1024 dimensions for the embedding model
);
-- Create a function to search for documents
create or replace function match_documents (
    query_embedding vector(1024),
    match_count int DEFAULT null,
    filter jsonb DEFAULT '{}'
  ) returns table (
    id bigint,
    content text,
    metadata jsonb,
    embedding jsonb,
    similarity float
  ) language plpgsql as $$ #variable_conflict use_column
  begin return query
select id,
  content,
  metadata,
  (embedding::text)::jsonb as embedding,
  1 - (documents.embedding <=> query_embedding) as similarity
from documents
where metadata @> filter
order by documents.embedding <=> query_embedding
limit match_count;
end;
$$;