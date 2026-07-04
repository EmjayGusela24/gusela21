
UPDATE candidates
SET image_url = split_part(image_url, ',', 2)
WHERE image_url LIKE 'data:image/%';


UPDATE students
SET photo_url = split_part(photo_url, ',', 2)
WHERE photo_url LIKE 'data:image/%';

;
