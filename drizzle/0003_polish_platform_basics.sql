UPDATE users SET status = 'disabled' WHERE status = 'inactive';

UPDATE data_dictionary_items
SET label = 'Disabled', value = 'disabled', updated_at = now()
WHERE value = 'inactive'
  AND dictionary_id IN (SELECT id FROM data_dictionaries WHERE key = 'user.status');
