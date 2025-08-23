-- Seed the home page hero content
-- This idempotent UPSERT populates the pages table with the hero HTML

INSERT INTO public.pages (slug, title, content_html)
VALUES ('home', 'WELCOME', $$<h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl tracking-tight">WELCOME</h1>

<div class="flex justify-center items-center space-x-4 mb-8">
  <svg class="w-8 h-8 text-pink-300 floating-flower" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m2 3a3 3 0 1 1-3 3m3-3v1m-3 3a3 3 0 1 1-3-3m3 3h-1m0-6a3 3 0 1 1 3-3M8 12H7m5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2"></path>
  </svg>
  <div class="w-20 h-1 bg-gradient-to-r from-pink-300 to-pink-300 rounded-full"></div>
  <svg class="w-8 h-8 text-pink-300 floating-flower" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m2 3a3 3 0 1 1-3 3m3-3v1m-3 3a3 3 0 1 1-3-3m3 3h-1m0-6a3 3 0 1 1 3-3M8 12H7m5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2"></path>
  </svg>
</div>

<div class="hero-content text-lg md:text-xl leading-relaxed text-white/90 space-y-5">
  <p>Welcome to Sistahology.com, the place <span class="text-sistah-pink font-semibold"><em>just for women</em></span> where we can be ourselves and experience the true essence of who we are and who we are becoming. My purpose in creating this space was to offer women a <span class="text-sistah-pink font-semibold"><strong>FREE online journaling platform</strong></span> where we can be ourselves, a place where we can empty our thoughts, talk out loud, say things we'd dare not say in public.</p>
  <p>Written expression gives me permission to be patient with myself, to slow down and reflect on lessons learned and unlearned, to forgive and forget what I have encountered through my experiences. The beautiful truth about digital journaling (and journaling online) is that we can simply <span class="text-sistah-pink font-semibold"><em>enjoy the journey.</em></span></p>
  <p>My goal in this space is that women are allowed to just <span class="text-sistah-pink font-semibold"><strong>BE</strong></span>. To create and just express and explore ourselves and exercise our right to write or draw, or paint or design, to do whatever it takes to be healthy and whole.</p>
  <p>So, welcome to your space. Welcome to reflecting online and journaling where you feel that, once again, <span class="text-sistah-pink font-semibold"><em>it's not about the destination, but the journey.</em></span></p>
</div>

<div class="mt-6 pt-6 border-t border-white/20 text-sm text-white/80 text-center italic">
  <p>— Andrea Brooks, Founder, Sistahology.com</p>
</div>

<div class="mt-12">
  <a href="/register" class="bg-gradient-to-r from-pink-500 via-pink-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white px-8 py-3 md:px-10 md:py-4 text-xl rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300">
    Start Your FREE Journey Today
  </a>
  <p class="text-white/80 mt-4 text-lg">Join thousands of women in this unique space</p>
</div>$$)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    content_html = EXCLUDED.content_html;