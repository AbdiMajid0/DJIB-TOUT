-- BUG-17, volet base de donnees : la contrainte UNIQUE (email) compare la casse
-- brute. L'application normalise desormais (trim + minuscules) a chaque point
-- d'entree, mais l'invariant doit vivre ici : une ligne heritee en majuscules
-- est injoignable a la connexion, et « A@x.com » / « a@x.com » peuvent coexister.

-- Echoue explicitement si deux comptes ne different que par la casse : les
-- fusionner automatiquement supprimerait des donnees. A resoudre a la main.
DO $$
DECLARE
    doublon text;
BEGIN
    SELECT lower(btrim(email)) INTO doublon
    FROM public.users
    GROUP BY lower(btrim(email))
    HAVING count(*) > 1
    LIMIT 1;
    IF doublon IS NOT NULL THEN
        RAISE EXCEPTION 'Comptes en double a la casse pres pour % : fusionner ou supprimer avant de migrer.', doublon;
    END IF;
END $$;

UPDATE public.users
SET email = lower(btrim(email))
WHERE email <> lower(btrim(email));

-- La contrainte UNIQUE (email) d'origine reste en place ; cet index rend le
-- doublon impossible quelle que soit la casse saisie par un futur point d'entree.
CREATE UNIQUE INDEX ux_users_email_lower ON public.users (lower(email));
