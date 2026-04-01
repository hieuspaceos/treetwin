/**
 * Hero section form — headline, subtitle, CTA buttons, background image, embed.
 */
import type { HeroData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, textareaStyle, CtaListEditor, ImageField, VariantPicker, FIELD_HELP } from './form-primitives'

export function HeroSectionForm({ data, onChange }: FormProps<HeroData>) {
  const set = (k: keyof HeroData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Headline" help={FIELD_HELP['hero.headline']}>
        <input style={inputStyle} value={data.headline || ''} onChange={(e) => set('headline', e.target.value)} />
      </Field>
      <Field label="Subtitle" help={FIELD_HELP['hero.subheadline']}>
        <textarea style={textareaStyle} value={data.subheadline || ''} onChange={(e) => set('subheadline', e.target.value)} />
      </Field>
      <VariantPicker sectionType="hero" value={data.variant || 'centered'} onChange={(v) => set('variant', v)} />
      {data.variant !== 'minimal' && (
        <CtaListEditor cta={data.cta} onChange={(v) => set('cta', v)} />
      )}
      {(data.variant === 'video-bg' || data.variant === 'split') && (
        <Field label="Background Photo" help={FIELD_HELP['hero.backgroundImage']}>
          <ImageField value={data.backgroundImage || ''} onChange={(v) => set('backgroundImage', v)} uploadPath="hero" placeholder="https://..." />
        </Field>
      )}
      {(data.variant === 'split' || data.variant === 'centered' || data.variant === 'video-bg') && (
        <Field label="Media URL (video or embed)" help={FIELD_HELP['hero.embed']}>
          <input style={inputStyle} value={data.embed || ''} onChange={(e) => set('embed', e.target.value)} placeholder="https://cdn.example.com/video.mp4 or YouTube embed" />
        </Field>
      )}
    </>
  )
}
