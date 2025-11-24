import { Lock, Heart, Link, Zap, Crown, Lightbulb, Settings, Flame, Mountain } from 'lucide-react';

export const mockData = {
  neuroWindows: [
    {
      icon: <Lock size={32} className="text-gray-700" />,
      headline: "Unlock the Croc Brain",
      subheadline: "Skip the mental filters that kill your message",
      modalKey: "croc-brain"
    },
    {
      icon: <Heart size={32} className="text-red-500" />,
      headline: "Put Them in a Buying Mood",
      subheadline: "Evoke emotions that spark buying",
      modalKey: "buying-mood"
    },
    {
      icon: <Link size={32} className="text-blue-600" />,
      headline: "Bring People Into Your Story",
      subheadline: "Activate mirror neurons for deeper connections",
      modalKey: "mirror-neurons"
    },
    {
      icon: <Zap size={32} className="text-yellow-500" />,
      headline: "Get Your Story Remembered",
      subheadline: "Make your message stick with glutamate",
      modalKey: "glutamate-memory"
    }
  ],

  problems: [
    "Endless scrolling past your content without engagement",
    "Viewers who watch but never take action",
    "Forgettable brand messages that fade immediately",
    "Low conversion rates despite high view counts",
    "Generic content that fails to build trust"
  ],

  solutions: [
    "Neurochemical triggers that bypass mental filters",
    "Emotion-driven scripts that compel action",
    "Memory-enhancing story structures using glutamate",
    "Trust-building oxytocin activation techniques",
    "Personalized neuro-based content that resonates"
  ],

  targetAudience: [
    {
      name: "Founder",
      icon: <Crown size={48} className="text-blue-900" />,
      shortDescription: "Building and scaling businesses"
    },
    {
      name: "Expert",
      icon: <Lightbulb size={48} className="text-purple-600" />,
      shortDescription: "Sharing knowledge and expertise"
    },
    {
      name: "Operator",
      icon: <Settings size={48} className="text-green-600" />,
      shortDescription: "Managing operations and processes"
    },
    {
      name: "Mission Driven",
      icon: <Heart size={48} className="text-red-500" />,
      shortDescription: "Creating positive impact"
    },
    {
      name: "Content Creator",
      icon: <Flame size={48} className="text-orange-500" />,
      shortDescription: "Crafts content that connects"
    },
    {
      name: "Lifestyle Architect",
      icon: <Mountain size={48} className="text-blue-500" />,
      shortDescription: "Designing intentional living"
    }
  ],

  howItWorks: [
    {
      title: "Choose Your Story Mode",
      description: "Select from daily prompt, origin story prompt, video script, or hero's journey.",
      image: "https://customer-assets.emergentagent.com/job_neuro-brand/artifacts/fwymtnep_choose%20your%20story.png"
    },
    {
      title: "Choose Your Prompt",
      description: "Select work type, neurochemical mood, and generate prompt. You can regenerate to get the prompt you like.",
      image: "https://customer-assets.emergentagent.com/job_neuro-brand/artifacts/fryqdv0v_generate%20your%20prompt.png"
    },
    {
      title: "Craft Your Video Script",
      description: "Select work type, neurochemical mood, content, generate script.",
      image: "https://customer-assets.emergentagent.com/job_neuro-brand/artifacts/r1iyuuga_craft%20your%20script.png"
    },
    {
      title: "Add Media",
      description: "Add b-roll video or audio. Create AI prompts to create video in Veo 3 or Runway and music in Suno.",
      image: "https://customer-assets.emergentagent.com/job_neuro-brand/artifacts/b0qfdtr7_add%20media.png"
    },
    {
      title: "Edit Your Video",
      description: "Add video, music, voiceover narration, and images in the sequence you want and export.",
      image: "https://customer-assets.emergentagent.com/job_neuro-brand/artifacts/rw8z3vg7_edit%20your%20video.png"
    },
    {
      title: "Share Everywhere on Social",
      description: "Choose your platforms to share your video stories: LinkedIn, YouTube, IG, TikTok, Reddit, and others.",
      image: "https://customer-assets.emergentagent.com/job_neuro-brand/artifacts/mec8fq9v_social%20share.png"
    }
  ],

  faqs: [
    {
      question: "How does Relatable help me build trust with my audience?",
      answer: "Relatable uses neuroscience to trigger oxytocin — the brain's trust chemical — so people feel emotionally safe and connected while considering your product or service. Trust starts before the transaction."
    },
    {
      question: "Will people actually remember my story?",
      answer: "Yes. Relatable's neuro-based Founder's Brand stories activate glutamate (the memory chemical) and mirror neurons — helping people feel your story as if it were their own. That emotional connection makes your message stick."
    },
    {
      question: "Can I really scale emotional connection with video?",
      answer: "Absolutely. Relatable lets you record once and connect thousands of times — all while creating the emotional resonance of a 1:1 conversation. It's human storytelling at scale."
    },
    {
      question: "I'm busy. How does this help me show up consistently?",
      answer: "Your stories build your Founder Brand. Your brand becomes a daily trust-building engine. Relatable automates the scripting, editing, and distribution of your message — so you show up with intention even when you're not online."
    },
    {
      question: "Is this approach aligned with how people buy today?",
      answer: "Yes. 72% of buyers now prefer a seller-free journey. Relatable helps you pull people in through emotional storytelling instead of pushing sales tactics. This matches how the Relationship Economy works."
    },
    {
      question: "How is this different from other video tools?",
      answer: "Relatable is built on brain science — not guesswork. It uses AI-powered storytelling rooted in neuroscience to consistently generate trust, desire, and action from your audience."
    },
    {
      question: "How can I use neuroscience to make my brand more trustworthy?",
      answer: "By leveraging neuroscience-triggering storytelling techniques, mirror neuron activation, and curiosity-driven narratives that bypass the brain's croc brain sales filters and create genuine emotional connections."
    },
    {
      question: "What's the best way to structure a brand video that builds trust?",
      answer: "Start with a relatable problem, activate mirror neurons through shared experiences, trigger oxytocin with vulnerability, and use glutamate-sparking insights to make your message memorable."
    },
    {
      question: "What is retrieval-augmented optimization (RAO) and how do I use it?",
      answer: "RAO is content optimization for AI discovery. Currently SEO search is dropping by over 30% and will continue to die over time. To get RAO noticed, structure your content with clear headings, use semantic keywords, answer common questions directly, and format information in ways that AI models can easily parse and retrieve."
    },
    {
      question: "How do I get my content found by ChatGPT or Perplexity?",
      answer: "Use RAO (Retrieval-Augmented Optimization) principles: structured headings, semantic keywords, clear question-answer formats, and content that directly addresses common queries about your expertise."
    },
    {
      question: "How do I make customers feel something before they buy something?",
      answer: "Use neurotransmitter-targeted storytelling: oxytocin for trust, dopamine for anticipation, serotonin for confidence, and mirror neuron activation through relatable experiences and emotional vulnerability."
    },
    {
      question: "What story formats work best for product and service brands?",
      answer: "Story formats that work best trigger trust, not stress—founder stories, relatable customer transformations, and mission-driven narratives release oxytocin and bypass the brain's sales filter. Unlike fear-based problem-agitate-solution tactics that spike cortisol and shut down curiosity, neuroscience-backed stories build emotional connection and lasting memory."
    },
    {
      question: "How do oxytocin and dopamine affect customer decision-making?",
      answer: "Oxytocin builds trust and emotional connection, making customers more receptive to your message. Dopamine creates anticipation and reward-seeking behavior, driving engagement and action-taking."
    }
  ]
};

export default mockData;