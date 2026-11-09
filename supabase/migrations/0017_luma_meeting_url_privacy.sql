-- A manage-scoped Luma API response can include the host-only meeting URL.
-- Mirrored events send visitors to their canonical Luma page, so these URLs
-- must never remain in the publicly-readable events row.

update events
set online_url = null,
    updated_at = now()
where external_source = 'luma'
  and online_url is not null;
