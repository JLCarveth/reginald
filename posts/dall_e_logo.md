---
title: Generating a Logo Using Dall-E
author: John L. Carveth
publish_date: 2022-08-26
---
I was recently granted access to [Dall-E](https://openai.com/dall-e-2), a new artificial intelligence that can generate images from a single text prompt. I had already read an article about [generating a logo](https://jacobmartins.com/posts/how-i-used-dalle2-to-generate-the-logo-for-octosql/) using the technology and I knew it was something I wanted to pursue. So I went about generating some images.  
  
The first prompt I tried was incredibly succinct: `cute mascot logo`.  
|||||
|---|---|---|---|
|<img src="../img/1-1.webp" width="100" alt="image1"/>|<img src="../img/1-2.webp" width="100" alt="image1"/>|<img src="../img/1-3.webp" width="100" alt="image1"/>|<img src="../img/1-4.webp" width="100"  alt="image1"/>|  

The results are interesting. The first image is the most different from the rest, while also being the least desirable. None of those nine characters are particularly cute, nor would they make a good logo. The following three results are passable, and serve as a basis for further iteration. What I find impressive is the huge variance between each result, each result with a unique art style. Also notice how Dall-E is trying to add some text to the logos, no doubt an artifact of the training data.

Since this blog was built using [Deno](deno.com), the default logo was a dinosaur. Let's stick with this theme. The next query I tried returned even better results, and I was almost happy stopping here. The query: `cute dinosaur mascot logo round`.
|||||
|---|---|---|---|
|<img src="../img/2-1.webp" width="100" alt="image1"/>|<img src="../img/2-2.webp" width="100" alt="image2"/>|<img src="../img/2-3.webp" width="100" alt="image3"/>|<img src="../img/2-4.webp" width="100" alt="image4"/>|

Not only are these dinosaurs cute, each result is contained nicely within a circle. One even has a company name!  

I really like that first image, however you might've noticed the poor little guy's arm is all messed up. Luckily, Dall-E can fix that for us. By editing the generated picture, we can mark parts of the photo for Dall-E to change. Here's two modified images Dall-E generated: 
|||
|---|---|
|<img src="../img/9-1.webp" alt="image1" width="150">|<img src="../img/9-2.webp" alt="image2" width="150">|

As you can see, our little dinosaur's arm is looking a lot better. Personally, I am happy with the second picture. And just like that, we have generated a completely unique logo for the blog, in less than a fifteen minutes. In fact, writing this blog post took longer than generating a usable image. 
