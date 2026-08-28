SELECT c.id, c."fullName", c."trainerId", tp."fullName" as trainer_name
FROM "Client" c
LEFT JOIN "TrainerProfile" tp ON c."trainerId" = tp.id
WHERE c."trainerId" = 'cm_test_trainer_01';