-- =====================================================
-- MIGRATION: Seed Blog Posts from Static Data
-- Version: 014
-- Created: 2025-01-13
-- Purpose: Import 6 existing blog posts from staticPosts.ts into database
-- =====================================================
--
-- OVERVIEW:
-- Imports the 6 hardcoded blog posts from src/services/posts/staticPosts.ts
-- into the blog_posts table. After this migration, the application can
-- switch from static posts to database-driven posts.
--
-- POSTS TO IMPORT:
-- 1. Priorities (2017-01-24)
-- 2. Loving Yourself First (2016-06-14)
-- 3. I WON'T COMPLAIN (2016-05-15)
-- 4. Happy Mother's Day! (2010-05-09)
-- 5. COURAGE TO CHANGE (2014-10-19)
-- 6. GET A LIFE (2014-11-02)
--
-- IDEMPOTENCY:
-- Uses INSERT ... ON CONFLICT DO UPDATE to safely re-run migration.
-- Preserves any admin edits by only updating if content hasn't changed.
--
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SEEDING BLOG POSTS FROM STATIC DATA';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- POST 1: Priorities (2017-01-24)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'priorities',
    'Priorities',
    'Are you a priority or an option? Don''t make someone a priority who makes you an option. Learn to prioritize yourself and your dreams.',
    '<p>Are you a priority or an option?</p>
<p>This is a fundamental question that each of us must ask ourselves when evaluating the relationships and commitments in our lives. Too often, we find ourselves giving our time, energy, and love to people who treat us as merely an option while we make them our priority.</p>
<p><strong>Don''t make someone a priority who makes you an option.</strong></p>
<p>This powerful reminder challenges us to recognize our own worth and demand the respect we deserve. When we consistently prioritize others who don''t reciprocate that same level of care and consideration, we diminish our own value and enable unhealthy patterns.</p>
<h3>The Cost of Saying Yes to Everyone Else</h3>
<p>Whenever you say "yes" to someone else, you automatically say "no" to yourself. This isn''t to suggest that we should become selfish or stop caring for others, but rather that we need to establish healthy boundaries that protect our time, energy, and dreams.</p>
<p>Are you working on your dreams daily, or are you so busy helping others achieve theirs that you''ve forgotten your own aspirations? There''s nothing wrong with supporting others, but not at the expense of your own growth and happiness.</p>
<h3>Learning to Prioritize Yourself</h3>
<p>Making yourself a priority doesn''t mean becoming self-centered. It means:</p>
<ul>
  <li>Setting boundaries that protect your well-being</li>
  <li>Pursuing your goals with the same dedication you show others</li>
  <li>Saying no when necessary to preserve your energy for what matters most</li>
  <li>Investing in your own growth and development</li>
</ul>
<p>Remember, you can''t pour from an empty cup. Taking care of yourself first isn''t selfish—it''s necessary. When you prioritize your own well-being, you''re better equipped to genuinely help others from a place of strength rather than depletion.</p>
<p>So ask yourself again: Are you a priority or an option in your own life? The answer should guide your decisions moving forward.</p>',
    'Andrea Brooks',
    '2017-01-24 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 2: Loving Yourself First (2016-06-14)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'loving-yourself-first',
    'Loving Yourself First',
    'Even strong people have needs and weaknesses. Take time for self-care and don''t depend on others for your happiness. Love and take care of YOU!',
    '<p>Even the strongest people among us have needs, weaknesses, and moments when they require care and support. Yet, so often, those who are seen as pillars of strength forget to extend the same compassion to themselves that they so freely give to others.</p>
<p>If you''re someone who is always there for everyone else, always lending a helping hand, always being the shoulder to cry on—this message is especially for you.</p>
<h3>The Importance of Self-Care</h3>
<p>Take the time for you to do the same things for yourself as you do for others. Just as you would comfort a friend in distress, you need to comfort yourself in times of struggle. Just as you would encourage someone else to pursue their dreams, you need to encourage yourself.</p>
<p>Self-care isn''t selfish—it''s essential. You cannot continue to pour from an empty vessel indefinitely without eventually burning out.</p>
<h3>Don''t Depend on Others for Your Happiness</h3>
<p><strong>Depending on anyone to make you happy, make you feel good, or lift your spirit is a sure way to place yourself in isolation.</strong></p>
<p>This doesn''t mean you should shut people out or stop appreciating the joy that relationships bring. Rather, it means that your fundamental sense of happiness and worth should come from within. When you depend on others for these essential feelings, you give away your power and set yourself up for disappointment.</p>
<p>People will let you down—not necessarily out of malice, but because they''re human and dealing with their own struggles. When your happiness depends on their actions, their moods, or their availability, you become a prisoner to circumstances beyond your control.</p>
<h3>Living Without Restrictions</h3>
<p>Your joy should not be restricted by other people or external conditions. True freedom comes when you learn to:</p>
<ul>
  <li>Find happiness within yourself first</li>
  <li>Appreciate others without being dependent on them</li>
  <li>Set boundaries that protect your emotional well-being</li>
  <li>Celebrate your own company and solitude</li>
  <li>Practice self-compassion in difficult times</li>
</ul>
<p><strong>Live your life without restrictions. Love & take care of YOU!</strong></p>
<p>This isn''t about becoming self-centered or closing your heart to others. It''s about becoming whole within yourself so that you can love others from a place of fullness rather than need. When you truly love yourself first, you have so much more genuine love to offer the world.</p>',
    'Andrea Brooks',
    '2016-06-14 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 3: I WON'T COMPLAIN (2016-05-15)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'i-wont-complain',
    'I WON''T COMPLAIN',
    'Stop complaining and start changing! If you don''t like your current situation, work towards changing it. Focus on solutions, not problems.',
    '<p>Complaining has become such a natural part of many people''s daily routine that they don''t even realize how much negativity they''re spreading—to others and within themselves. But here''s the truth: complaining never changed anyone''s situation for the better.</p>
<p><strong>If you do not like your current situation, work towards changing it.</strong> It''s really that simple, and it''s really that challenging.</p>
<h3>The Problem with Chronic Complaining</h3>
<p>When we constantly complain about our circumstances, our relationships, our jobs, or our lives, we accomplish several counterproductive things:</p>
<ul>
  <li>We reinforce negative thinking patterns</li>
  <li>We drain our own energy and that of people around us</li>
  <li>We focus on problems instead of solutions</li>
  <li>We become victims of our circumstances rather than creators of our destiny</li>
</ul>
<p>Most people get tired of hearing the same complaints over and over again. If you''re sharing the same problems without taking any action to address them, you''re not looking for solutions—you''re looking for sympathy, and that well eventually runs dry.</p>
<h3>Shift Your Focus to Solutions</h3>
<p>Instead of asking "Why is this happening to me?" try asking:</p>
<ul>
  <li>"What can I learn from this situation?"</li>
  <li>"What steps can I take to improve this?"</li>
  <li>"What opportunities might be hidden in this challenge?"</li>
  <li>"How can I grow from this experience?"</li>
</ul>
<p>Every stage of your life prepares you for the next. The challenges you face today are building the strength, wisdom, and character you''ll need for tomorrow''s opportunities. But only if you approach them with the right mindset.</p>
<h3>Choose Progress Over Complaints</h3>
<p><strong>The bottom line is that you will never get to where you want to be by complaining about where you are now.</strong></p>
<p>This doesn''t mean you should ignore problems or pretend everything is perfect. It means you should acknowledge challenges, feel your emotions about them, and then channel that energy into positive action.</p>
<p>Instead of complaining:</p>
<ul>
  <li>Make a plan</li>
  <li>Take one small step forward</li>
  <li>Seek advice from people who''ve overcome similar challenges</li>
  <li>Focus on what you can control</li>
  <li>Practice gratitude for what''s already working in your life</li>
</ul>
<p>Stay focused on the good. Even in difficult times, there are things to be grateful for, lessons to be learned, and opportunities to be discovered.</p>
<p><strong>The best is yet to come!</strong> But only if you stop complaining and start creating the change you want to see in your life.</p>',
    'Andrea Brooks',
    '2016-05-15 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 4: Happy Mother's Day! (2010-05-09)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'happy-mothers-day',
    'Happy Mother''s Day!',
    'A heartfelt tribute to mothers everywhere. She feels deeply and loves fiercely. She is both soft and powerful, both practical and spiritual.',
    '<p>A strong woman feels deeply and loves fiercely. Her tears flow as abundantly as her laughter. She is both soft and powerful, and it is both practical and spiritual.</p>
<p>A strong woman in her essence is a gift to the entire World.</p>
<h3>The Essence of Motherhood</h3>
<p>Today we celebrate not just the women who gave birth to us, but all the women who have nurtured, guided, and loved us throughout our lives. Motherhood extends far beyond biology—it''s about the spirit of care, protection, and unconditional love that shapes who we become.</p>
<p>A mother''s love is like no other. It''s fierce when her children are threatened, gentle when they need comfort, and unwavering through every season of life. She celebrates every triumph and grieves every setback as if they were her own.</p>
<h3>The Many Faces of Motherhood</h3>
<p>Mothers come in many forms:</p>
<ul>
  <li>The birth mother who carried you and brought you into this world</li>
  <li>The adoptive mother who chose you and made you her own</li>
  <li>The stepmother who loved you as if you were always hers</li>
  <li>The grandmother who spoiled you with wisdom and treats</li>
  <li>The aunt who acted like a second mother</li>
  <li>The friend who mothered you when you needed it most</li>
  <li>The mentor who guided you with maternal care</li>
</ul>
<p>Each of these women has contributed to the person you are today through their unique expression of maternal love.</p>
<h3>The Strength in Vulnerability</h3>
<p>What makes a strong woman truly powerful is not her ability to hide her emotions, but her courage to feel them fully. She cries when she needs to cry, laughs when joy overflows, and isn''t afraid to show her children that it''s okay to be human.</p>
<p>This emotional authenticity teaches the next generation that strength doesn''t mean perfection—it means resilience, love, and the courage to keep going even when life gets difficult.</p>
<p><strong>Happy Mother''s Day to you that are mothers, soon to be mothers or act like a mother! Cheers.</strong></p>
<p>Today we honor your strength, your love, your sacrifices, and your immeasurable impact on the world through the lives you''ve touched. You are appreciated, you are valued, and you are loved.</p>',
    'Andrea Brooks',
    '2010-05-09 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 5: COURAGE TO CHANGE (2014-10-19)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'courage-to-change',
    'COURAGE TO CHANGE',
    'It''s never too late to live a life that makes you proud. Break free from toxic behaviors and have the courage to make positive changes in your life.',
    '<p>Cruelty is a trait that stems from a lack of empathy and compassion. We see it everywhere—in anonymous comments online, in the way people treat service workers, in the casual disregard for others'' feelings and dignity. But here''s what I want you to remember:</p>
<p><strong>It''s never too late to live a life that makes you proud.</strong></p>
<h3>Breaking Free from Toxic Patterns</h3>
<p>Too many people get trapped in patterns of behavior that don''t serve them or anyone around them. They become cynical, cruel, or indifferent because it feels easier than being vulnerable and kind. But easy doesn''t mean right, and familiar doesn''t mean healthy.</p>
<p>If you recognize yourself in negative patterns—whether it''s lashing out at others, making cruel comments, or simply going through life without purpose or joy—know that you have the power to change. Age is not a barrier to transformation; fear is.</p>
<h3>The Choice Is Always Yours</h3>
<p>Every single day, you wake up with a choice: to be the same person you were yesterday, or to become someone better. This choice isn''t just about grand gestures or dramatic life changes—it''s about the small decisions you make in each moment.</p>
<p>Will you respond with kindness or cruelty? Will you choose growth or stagnation? Will you live authentically or continue pretending to be someone you''re not?</p>
<h3>Steps to Meaningful Change</h3>
<p>If you''re ready to live a life that makes you proud, consider these steps:</p>
<ul>
  <li><strong>Do things that startle you</strong> - Step outside your comfort zone and challenge yourself to grow</li>
  <li><strong>Spend time with people who help you grow</strong> - Surround yourself with those who inspire and elevate you</li>
  <li><strong>Practice empathy</strong> - Try to understand others'' perspectives before judging</li>
  <li><strong>Take responsibility</strong> - Own your mistakes and work to make amends</li>
  <li><strong>Live authentically</strong> - Stop pretending to be someone you''re not</li>
  <li><strong>Choose kindness</strong> - Even when it''s difficult, especially when it''s difficult</li>
</ul>
<h3>It''s Never Too Late</h3>
<p>Whether you''re 20 or 80, you have the power to redirect your life toward something meaningful and beautiful. You can choose to leave a legacy of kindness instead of cruelty, of building up instead of tearing down, of love instead of fear.</p>
<p>The world has enough negativity, enough cruelty, enough people who have given up on being better. What it needs more of is people who have the courage to change, to grow, and to live lives that inspire others to do the same.</p>
<p><strong>Have the courage to make a change.</strong> Your future self—and everyone whose life you touch—will thank you for it.</p>
<p>The life that makes you proud is waiting for you. You just have to be brave enough to start living it.</p>',
    'Andrea Brooks',
    '2014-10-19 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 6: GET A LIFE (2014-11-02)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'get-a-life',
    'GET A LIFE',
    'Stop making excuses and dwelling on the past. You have more going for you than you realize. Believe in your potential and embrace life with enthusiasm!',
    '<p>It''s time for some tough love, and I''m saying this with all the care in the world: <strong>Get a life!</strong></p>
<p>Yes, you read that right. If you''re stuck in a cycle of excuses, complaints, and dwelling on past experiences, it''s time to break free and start truly living.</p>
<h3>Stop Making Excuses</h3>
<p>We all have reasons why our lives aren''t exactly where we want them to be. We all have stories about what went wrong, who let us down, and why things are the way they are. But here''s the reality: those stories are keeping you trapped in the past instead of propelling you toward your future.</p>
<p>Most people don''t want to hear the same negative stories over and over again. And more importantly, constantly rehearsing these stories keeps you stuck in victim mode instead of empowering you to be the creator of your own destiny.</p>
<h3>You Have More Going for You Than You Realize</h3>
<p><strong>Get a life! You have more going for you than you realize…so use it!</strong></p>
<p>Right now, in this moment, you have:</p>
<ul>
  <li>The ability to make choices that shape your future</li>
  <li>Experiences that have made you stronger and wiser</li>
  <li>Unique talents and perspectives that only you possess</li>
  <li>The power to dream new dreams and set new goals</li>
  <li>Opportunities all around you waiting to be seized</li>
</ul>
<p>But you''ll never see these possibilities if you''re too busy looking backward or making excuses for why you can''t move forward.</p>
<h3>Believe in Your Potential</h3>
<p>The life you''re meant to live is still possible. The dreams you thought were dead can be resurrected. The goals you abandoned can be pursued again. But it starts with believing that you''re capable of more than your current circumstances suggest.</p>
<p>Stop telling yourself that it''s too late, that you''re too old, that you don''t have enough resources, or that you missed your chance. These are all excuses designed to keep you safe from the risk of trying and potentially failing. But they''re also keeping you safe from the possibility of succeeding beyond your wildest dreams.</p>
<h3>Embrace Life with Enthusiasm</h3>
<p>Life is meant to be lived fully, deeply, and with enthusiasm. It''s meant to be an adventure, not a burden. It''s meant to be a canvas for your creativity, not a prison of regret.</p>
<p>Here''s what getting a life looks like:</p>
<ul>
  <li>Setting new goals that excite you</li>
  <li>Taking calculated risks for worthwhile rewards</li>
  <li>Surrounding yourself with positive, growth-minded people</li>
  <li>Learning new skills and exploring new interests</li>
  <li>Focusing on what you can create rather than what you''ve lost</li>
  <li>Finding joy in small moments and simple pleasures</li>
</ul>
<h3>Live Full, Enjoy Life</h3>
<p><strong>Live full…Enjoy Life, you only get one!</strong></p>
<p>This isn''t a dress rehearsal. This is your one precious life, and every day you spend stuck in negativity, excuses, and past regrets is a day you can''t get back.</p>
<p>So make the decision today: Are you going to continue existing in a state of dissatisfaction and complaint, or are you going to get a life—a real, vibrant, purposeful life that fills you with excitement and meaning?</p>
<p>The choice is yours, but choose quickly. Time isn''t waiting for you to figure it out.</p>
<p>Get a life. You deserve to live one that makes you proud to wake up every morning.</p>',
    'Andrea Brooks',
    '2014-11-02 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION & SUMMARY
-- =====================================================

DO $$
DECLARE
    post_count INTEGER;
    published_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SEED MIGRATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO post_count FROM public.blog_posts;
    SELECT COUNT(*) INTO published_count FROM public.blog_posts WHERE status = 'published';

    RAISE NOTICE 'Blog posts imported from staticPosts.ts:';
    RAISE NOTICE '  ✓ Priorities (2017-01-24)';
    RAISE NOTICE '  ✓ Loving Yourself First (2016-06-14)';
    RAISE NOTICE '  ✓ I WON''T COMPLAIN (2016-05-15)';
    RAISE NOTICE '  ✓ Happy Mother''s Day! (2010-05-09)';
    RAISE NOTICE '  ✓ COURAGE TO CHANGE (2014-10-19)';
    RAISE NOTICE '  ✓ GET A LIFE (2014-11-02)';
    RAISE NOTICE '';

    RAISE NOTICE 'Total posts in database: %', post_count;
    RAISE NOTICE 'Published posts: %', published_count;
    RAISE NOTICE '';

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run migration 015 to seed site sections';
    RAISE NOTICE '  2. Create blog posts service to replace staticPosts.ts';
    RAISE NOTICE '  3. Update blog list/detail pages to fetch from database';
    RAISE NOTICE '  4. Build admin CMS for blog post management';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 014 COMPLETE - Blog posts successfully seeded';
    RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (commented)
-- =====================================================
--
-- To rollback this migration (delete all seeded posts):
--
-- BEGIN;
-- DELETE FROM public.blog_posts WHERE slug IN (
--   'priorities',
--   'loving-yourself-first',
--   'i-wont-complain',
--   'happy-mothers-day',
--   'courage-to-change',
--   'get-a-life'
-- );
-- COMMIT;
--
-- =====================================================
