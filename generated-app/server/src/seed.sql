-- Seed once (if no clients)
do $$
begin
  if not exists (select 1 from clients) then
    insert into clients(name, bio, goals_json)
    values (
      'Demo Borrower LLC',
      'Owner-operated services business. Borrower seeks loan approval for expansion; emphasizes stable recurring cash flow.',
      '{"loan_purpose":"expansion","risk_appetite":"moderate","priority":"recurring_income"}'::jsonb
    );
  end if;
end $$;

-- Seed demo documents + extracted fields (if no documents)
do $$
declare
  c uuid;
  doc_k1_2022 uuid;
  doc_k1_2023 uuid;
  doc_1040_2023 uuid;
begin
  select id into c from clients order by created_at asc limit 1;

  if not exists (select 1 from documents where client_id=c) then
    insert into documents(client_id, doc_type, tax_year, payload_json)
      values (c, 'K1', 2022, '{"entity":"S-Corp A"}'::jsonb)
      returning id into doc_k1_2022;

    insert into extracted_fields(document_id, field_key, field_label, value_num)
      values
        (doc_k1_2022, 'k1.distributions', 'K-1 Distributions', 160000),
        (doc_k1_2022, 'k1.contributions', 'K-1 Contributions', 30000);

    insert into documents(client_id, doc_type, tax_year, payload_json)
      values (c, 'K1', 2023, '{"entity":"S-Corp A"}'::jsonb)
      returning id into doc_k1_2023;

    insert into extracted_fields(document_id, field_key, field_label, value_num)
      values
        (doc_k1_2023, 'k1.distributions', 'K-1 Distributions', 185000),
        (doc_k1_2023, 'k1.contributions', 'K-1 Contributions', 40000);

    insert into documents(client_id, doc_type, tax_year, payload_json)
      values (c, '1040', 2023, '{"form":"1040"}'::jsonb)
      returning id into doc_1040_2023;

    insert into extracted_fields(document_id, field_key, field_label, value_num)
      values
        (doc_1040_2023, 'tax.depreciation', 'Depreciation', 22000),
        (doc_1040_2023, 'tax.net_income', 'Net Income', 98000);
  end if;
end $$;
