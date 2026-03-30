/**
 * Smart default data for each section type.
 * When a user adds a new section, pre-fill it with realistic sample content
 * so they see a working example immediately and can edit from there.
 * Content is obviously placeholder (generic names, generic numbers).
 */
import type { SectionType, SectionData } from '@/lib/landing/landing-types'

/** Returns realistic placeholder data for a given section type */
export function getSmartDefault(type: SectionType): SectionData {
  const defaults: Record<string, SectionData> = {
    hero: {
      headline: 'Build Something Amazing',
      subheadline: 'The simplest way to create beautiful landing pages that convert visitors into customers.',
      cta: [
        { text: 'Get Started Free', url: '#pricing', variant: 'primary' },
        { text: 'See How It Works', url: '#how-it-works', variant: 'outline' },
      ],
      variant: 'centered',
    },

    features: {
      heading: 'Everything You Need',
      subheading: 'Powerful features that help you grow',
      columns: 3,
      items: [
        { icon: '⚡', title: 'Lightning Fast', description: 'Built for speed. Your pages load in under 1 second.' },
        { icon: '🔒', title: 'Secure by Default', description: 'Enterprise-grade security with zero configuration needed.' },
        { icon: '📱', title: 'Works Everywhere', description: 'Looks great on phones, tablets, and desktops.' },
      ],
    },

    pricing: {
      heading: 'Simple, Transparent Pricing',
      subheading: 'No hidden fees. Cancel anytime.',
      plans: [
        {
          name: 'Free',
          price: '$0',
          period: '/month',
          description: 'For individuals getting started',
          features: ['1 project', 'Basic support', 'Community access'],
          cta: { text: 'Start Free', url: '#' },
        },
        {
          name: 'Pro',
          price: '$29',
          period: '/month',
          description: 'For growing businesses',
          badge: 'Popular',
          features: ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom domain'],
          cta: { text: 'Start Free Trial', url: '#' },
          highlighted: true,
        },
        {
          name: 'Enterprise',
          price: '$99',
          period: '/month',
          description: 'For large teams',
          features: ['Everything in Pro', 'Dedicated support', 'SSO & security', 'Custom integrations', 'SLA guarantee'],
          cta: { text: 'Contact Sales', url: '#' },
        },
      ],
    },

    testimonials: {
      heading: 'What Our Customers Say',
      items: [
        { quote: 'This completely changed how we build landing pages. We went from weeks to hours.', name: 'Sarah Johnson', role: 'Marketing Director', company: 'GrowthCo' },
        { quote: "The easiest tool I've ever used. My team was up and running in minutes.", name: 'Alex Chen', role: 'Founder', company: 'LaunchPad' },
      ],
    },

    faq: {
      heading: 'Frequently Asked Questions',
      items: [
        { question: 'How do I get started?', answer: 'Sign up for a free account and follow our 5-minute setup guide. No credit card required.' },
        { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time with no penalty. Your data stays available for 30 days.' },
        { question: 'Do you offer support?', answer: 'We offer email support for all plans and priority support for Pro and Enterprise customers.' },
      ],
    },

    cta: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of happy customers. Free to try, no credit card required.',
      cta: [
        { text: 'Start Free Trial', url: '#', variant: 'primary' },
        { text: 'Schedule a Demo', url: '#', variant: 'outline' },
      ],
    },

    stats: {
      heading: 'Trusted by Thousands',
      items: [
        { value: '10,000+', label: 'Happy Customers' },
        { value: '99.9%', label: 'Uptime' },
        { value: '150+', label: 'Countries' },
        { value: '4.9★', label: 'Average Rating' },
      ],
    },

    'how-it-works': {
      heading: 'How It Works',
      subheading: 'Get started in 3 simple steps',
      items: [
        { title: 'Sign Up', description: 'Create your free account in under 30 seconds.', icon: '1️⃣' },
        { title: 'Customize', description: 'Choose a template and make it yours with our visual editor.', icon: '2️⃣' },
        { title: 'Launch', description: 'Hit publish and share your page with the world.', icon: '3️⃣' },
      ],
    },

    team: {
      heading: 'Meet Our Team',
      members: [
        { name: 'Jane Doe', role: 'CEO & Co-Founder', bio: 'Passionate about making technology accessible to everyone.' },
        { name: 'John Smith', role: 'Head of Product', bio: '10+ years building products that people love.' },
      ],
    },

    // Minimal defaults for simpler sections
    nav: { brandName: '', links: [] },
    'logo-wall': { logos: [] },
    footer: { text: '', links: [] },
    video: { url: '' },
    image: { src: '', alt: '' },
    'image-text': { image: { src: '' }, text: '', imagePosition: 'left' },
    gallery: { images: [] },
    map: { address: '' },
    'rich-text': { content: '## Your content here\n\nStart writing in Markdown...' },
    divider: { style: 'line', height: 40 },
    countdown: { targetDate: '', heading: 'Offer ends in' },
    'contact-form': {
      heading: 'Contact Us',
      fields: [
        { label: 'Name', type: 'text' },
        { label: 'Email', type: 'email' },
        { label: 'Message', type: 'textarea' },
      ],
      submitText: 'Send Message',
    },
    banner: { text: 'Announcement goes here', variant: 'info' },
    comparison: {
      heading: 'Comparison',
      columns: [{ label: 'Us' }, { label: 'Others' }],
      rows: [{ label: 'Price', values: ['Free', 'Paid'], highlight: true }],
    },
    'ai-search': {
      placeholder: 'Describe what you need...',
      thinkingText: 'Analyzing...',
      resultsHeader: 'Suggestions',
      hints: [],
      defaultSuggestions: [],
      intents: [],
    },
    'social-proof': { text: 'Trusted by 100+ businesses', variant: 'inline' },
    layout: { columns: [1, 1], gap: '1rem', children: [] },
    popup: {
      heading: 'Wait! Before You Go...',
      text: 'Get 20% off your first order with code WELCOME20',
      cta: { text: 'Claim Discount', url: '#pricing' },
      trigger: { type: 'exit-intent' },
      showOnce: true,
      variant: 'centered',
    },
  }

  return defaults[type] ?? ({} as SectionData)
}
