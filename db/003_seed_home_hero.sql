-- Seed the home page hero content

INSERT INTO pages (slug, title, content_html)
VALUES ('home', 'Homepage Hero Section', $$<h2 class="text-xl sm:text-2xl md:text-4xl font-thin text-white mb-6 leading-tight drop-shadow-xl tracking-tight">
  Your Sacred Space <span class="text-sistah-pink font-semibold text-xl sm:text-2xl md:text-4xl italic">for Digital Journaling</span>
</h2>

<div class="h-1 bg-pink-300 rounded-full my-8"></div>

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
  <a href="/register" class="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white px-8 py-3 md:px-10 md:py-4 text-xl rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300">
    Start Your FREE Journey Today
  </a>
  <p class="text-white/80 mt-4 text-lg">Join thousands of women in this unique space</p>
</div>$$)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    content_html = EXCLUDED.content_html;
