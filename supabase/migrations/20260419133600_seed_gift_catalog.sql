insert into public.gift_catalog (id, name, rarity, coin_cost)
values
  ('rusty_skeleton_key','Rusty Skeleton Key','common',20),
  ('vip_wristband','VIP Wristband','common',30),
  ('redaction_roller','Redaction Roller','common',50),
  ('confidential_stamp','CONFIDENTIAL Stamp','common',75),
  ('receipt_rain','Receipt Rain','common',99),
  ('paper_trail_scroll','Paper Trail Scroll','common',50),
  ('evidence_bag_drop','Evidence Bag Drop','common',30),
  ('fingerprint_scan','Fingerprint Scan','common',20),
  ('magnifier_zoom','Magnifier Zoom','common',30),
  ('spotlight_sweep','Spotlight Sweep','common',50),
  ('truth_serum_vial','Truth Serum Vial','common',75),
  ('polygraph_beep','Polygraph Beep','common',20),
  ('encrypted_message','Encrypted Message','common',30),
  ('anonymous_tip_envelope','Anonymous Tip Envelope','common',50),
  ('signal_boost_tower','Signal Boost Tower','common',99),
  ('community_upvote_storm','Community Upvote Storm','common',75),
  ('pinned_receipt','Pinned Receipt','common',50),
  ('mic_drop','Mic Drop','common',99),

  ('master_skeleton_key','Master Skeleton Key','rare',299),
  ('backstage_pass_lanyard','Backstage Pass Lanyard','rare',499),
  ('whistleblower_whistle','Whistleblower Whistle','rare',299),
  ('leak_dropbox','Leak Dropbox','rare',799),
  ('burner_phone','Burner Phone','rare',499),
  ('hard_drive_drop','Hard Drive Drop','rare',799),
  ('archive_unlock','Archive Unlock','rare',499),
  ('thread_boost_rocket','Thread Boost Rocket','rare',799),
  ('crown_of_credibility','Crown of Credibility','rare',799),

  ('diamond_master_key','Diamond Master Key','legendary',2999),
  ('boss_key','Boss Key','legendary',6999),
  ('vault_unlock','Vault Unlock','legendary',19999)
on conflict (id) do update set
  name = excluded.name,
  rarity = excluded.rarity,
  coin_cost = excluded.coin_cost,
  is_active = true;
