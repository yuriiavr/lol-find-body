-- ============================================================================
--  Атомарний вступ у кімнату з перевіркою місткості.
--
--  Клієнтська перевірка max_players має гонку (TOCTOU): двоє можуть одночасно
--  прочитати «є місце» і обидва зайти, перевищивши ліміт. Ця функція робить
--  перевірку й вставку в одній транзакції. Викликати з клієнта так:
--      await supabase.rpc('join_room', { p_room_id: roomId })
--  Повертає: 'joined' | 'already_in' | 'full' | 'banned' | 'no_room'.
-- ============================================================================
create or replace function public.join_room(p_room_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cap int;
  v_cur int;
begin
  if v_uid is null then
    return 'no_auth';
  end if;

  select max_players into v_cap from public.rooms where id = p_room_id;
  if v_cap is null then
    return 'no_room';
  end if;

  if exists (select 1 from public.room_bans where room_id = p_room_id and user_id = v_uid) then
    return 'banned';
  end if;

  -- Уже в кімнаті — нічого не робимо.
  if exists (select 1 from public.room_participants where room_id = p_room_id and user_id = v_uid) then
    return 'already_in';
  end if;

  -- Блокуємо рядки кімнати, щоб підрахунок і вставка були атомарними.
  perform 1 from public.room_participants where room_id = p_room_id for update;
  select count(*) into v_cur from public.room_participants where room_id = p_room_id;

  if v_cur >= v_cap then
    return 'full';
  end if;

  insert into public.room_participants (room_id, user_id) values (p_room_id, v_uid);
  return 'joined';
end;
$$;

grant execute on function public.join_room(uuid) to authenticated;
