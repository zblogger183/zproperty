-- Peshawar was seeded with province = 'KPK' while every other Khyber
-- Pakhtunkhwa city (Abbottabad, Haripur, Swat) uses the full province name
-- 'Khyber Pakhtunkhwa'. Since /zip-codes groups cities by the literal
-- `province` string, this split Peshawar into its own "KPK" card, distinct
-- from the real "Khyber Pakhtunkhwa" card -- reported live by the user.
update cities set province = 'Khyber Pakhtunkhwa' where province = 'KPK';
