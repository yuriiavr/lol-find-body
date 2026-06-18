-- ============================================================================
--  Row Level Security (RLS) — джерело правди для авторизації на рівні БД.
--
--  Раніше у репозиторії не було жодного SQL, тож уся безпека трималася на
--  невидимих політиках у дашборді Supabase + на перевірках у server actions.
--  Цей файл робить політики явними й ревʼюабельними. Він спроєктований так,
--  щоб ДОЗВОЛЯТИ рівно те, що робить застосунок сьогодні (анонімне читання
--  профілів для discovery, операції учасника матчу/кімнати тощо).
--
--  ⚠️  Перед застосуванням на проді: перегляньте під свою схему й виконайте
--      на staging. Service-role ключ (rank-refresh) обходить RLS — це навмисно.
--  Застосування:  supabase db push    (або вставити в SQL Editor Supabase)
-- ============================================================================

-- ─── profiles ───────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true); -- discovery читає профілі публічно (зокрема анонімно)

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── matches ─────────────────────────────────────────────────────────────────
alter table public.matches enable row level security;

drop policy if exists "matches_select_participant" on public.matches;
create policy "matches_select_participant"
  on public.matches for select
  using (auth.uid() = user_id or auth.uid() = target_id);

drop policy if exists "matches_insert_sender" on public.matches;
create policy "matches_insert_sender"
  on public.matches for insert
  with check (auth.uid() = user_id);

-- Приймати/відхиляти може ЛИШЕ отримувач заявки.
drop policy if exists "matches_update_target" on public.matches;
create policy "matches_update_target"
  on public.matches for update
  using (auth.uid() = target_id)
  with check (auth.uid() = target_id);

-- ─── messages (1:1 чати матчів) ──────────────────────────────────────────────
alter table public.messages enable row level security;

drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member"
  on public.messages for select
  using (exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.user_id = auth.uid() or m.target_id = auth.uid())
  ));

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and m.status = 'ACCEPTED'
        and (m.user_id = auth.uid() or m.target_id = auth.uid())
    )
  );

-- Позначати прочитаним — лише вхідні повідомлення у власному матчі.
drop policy if exists "messages_update_member" on public.messages;
create policy "messages_update_member"
  on public.messages for update
  using (exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.user_id = auth.uid() or m.target_id = auth.uid())
  ));

-- ─── reviews ─────────────────────────────────────────────────────────────────
alter table public.reviews enable row level security;

-- Видимі: схвалені всім; власні (будь-якого статусу) — автору.
drop policy if exists "reviews_select_approved_or_own" on public.reviews;
create policy "reviews_select_approved_or_own"
  on public.reviews for select
  using (moderation_status = 'approved' or reviewer_id = auth.uid());

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (reviewer_id = auth.uid() and reviewer_id <> target_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

-- ─── custom_games (реєстр кастомних ігор) ────────────────────────────────────
alter table public.custom_games enable row level security;

drop policy if exists "custom_games_select_public" on public.custom_games;
create policy "custom_games_select_public"
  on public.custom_games for select
  using (true);

-- Лічильники оновлюють авторизовані користувачі (через свій cookie-клієнт).
drop policy if exists "custom_games_write_auth" on public.custom_games;
create policy "custom_games_write_auth"
  on public.custom_games for all
  to authenticated
  using (true)
  with check (true);

-- ─── rooms ───────────────────────────────────────────────────────────────────
alter table public.rooms enable row level security;

drop policy if exists "rooms_select_public" on public.rooms;
create policy "rooms_select_public"
  on public.rooms for select
  using (true);

drop policy if exists "rooms_insert_owner" on public.rooms;
create policy "rooms_insert_owner"
  on public.rooms for insert
  with check (owner_id = auth.uid());

drop policy if exists "rooms_update_owner" on public.rooms;
create policy "rooms_update_owner"
  on public.rooms for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Видаляти кімнату може власник; також дозволяємо «останньому, хто вийшов»
-- прибрати порожню кімнату (учасник, що ще присутній).
drop policy if exists "rooms_delete_owner_or_member" on public.rooms;
create policy "rooms_delete_owner_or_member"
  on public.rooms for delete
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = rooms.id and rp.user_id = auth.uid()
    )
  );

-- ─── room_participants ───────────────────────────────────────────────────────
alter table public.room_participants enable row level security;

drop policy if exists "room_participants_select_public" on public.room_participants;
create policy "room_participants_select_public"
  on public.room_participants for select
  using (true);

-- Приєднатися можна лише собою (і лише якщо не забанений у цій кімнаті).
drop policy if exists "room_participants_insert_self" on public.room_participants;
create policy "room_participants_insert_self"
  on public.room_participants for insert
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.room_bans b
      where b.room_id = room_participants.room_id and b.user_id = auth.uid()
    )
  );

-- Вийти може сам учасник; кікнути — власник кімнати.
drop policy if exists "room_participants_delete_self_or_owner" on public.room_participants;
create policy "room_participants_delete_self_or_owner"
  on public.room_participants for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rooms r
      where r.id = room_participants.room_id and r.owner_id = auth.uid()
    )
  );

-- ─── room_bans ───────────────────────────────────────────────────────────────
alter table public.room_bans enable row level security;

-- Бачити бан можуть власник кімнати або сам забанений (щоб клієнт вийшов).
drop policy if exists "room_bans_select_owner_or_self" on public.room_bans;
create policy "room_bans_select_owner_or_self"
  on public.room_bans for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rooms r
      where r.id = room_bans.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "room_bans_insert_owner" on public.room_bans;
create policy "room_bans_insert_owner"
  on public.room_bans for insert
  with check (exists (
    select 1 from public.rooms r
    where r.id = room_bans.room_id and r.owner_id = auth.uid()
  ));

-- ─── room_messages (чат кімнати) ─────────────────────────────────────────────
alter table public.room_messages enable row level security;

drop policy if exists "room_messages_select_member" on public.room_messages;
create policy "room_messages_select_member"
  on public.room_messages for select
  using (exists (
    select 1 from public.room_participants rp
    where rp.room_id = room_messages.room_id and rp.user_id = auth.uid()
  ));

drop policy if exists "room_messages_insert_member" on public.room_messages;
create policy "room_messages_insert_member"
  on public.room_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.room_participants rp
      where rp.room_id = room_messages.room_id and rp.user_id = auth.uid()
    )
  );
