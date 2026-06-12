-- 1. Sincronizar emails existentes da tabela auth.users para public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 2. Criar função de busca segura de e-mail por CPF
CREATE OR REPLACE FUNCTION public.get_email_by_cpf(search_cpf TEXT)
RETURNS TEXT AS $$
DECLARE
    found_email TEXT;
BEGIN
    -- 1. Tenta buscar o e-mail diretamente no perfil cadastrado
    SELECT email INTO found_email FROM public.profiles WHERE cpf = search_cpf;
    
    -- 2. Caso esteja nulo, busca na tabela auth.users e sincroniza o perfil
    IF found_email IS NULL THEN
        SELECT u.email INTO found_email
        FROM auth.users u
        JOIN public.profiles p ON p.id = u.id
        WHERE p.cpf = search_cpf;
        
        IF found_email IS NOT NULL THEN
            UPDATE public.profiles SET email = found_email WHERE cpf = search_cpf;
        END IF;
    END IF;
    
    RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dar permissão de execução para usuários anônimos (necessário para fluxo de login)
GRANT EXECUTE ON FUNCTION public.get_email_by_cpf(TEXT) TO anon, authenticated;
