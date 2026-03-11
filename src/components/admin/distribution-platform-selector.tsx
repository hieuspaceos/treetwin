/**
 * Platform multi-select for distribution post generation
 * Checkboxes for each platform, default all selected, with Select All / None toggle
 */

const ALL_PLATFORMS = [
  'Twitter/X', 'LinkedIn', 'Facebook', 'Reddit', 'Threads',
  'Hacker News', 'Dev.to', 'Hashnode', 'Medium', 'Viblo', 'Substack',
]

interface Props {
  selected: string[]
  onChange: (platforms: string[]) => void
  /** Hide Viblo when English is selected */
  language: 'auto' | 'vi' | 'en'
}

export function DistributionPlatformSelector({ selected, onChange, language }: Props) {
  const platforms = language === 'en'
    ? ALL_PLATFORMS.filter((p) => p !== 'Viblo')
    : ALL_PLATFORMS

  const allSelected = platforms.every((p) => selected.includes(p))

  function toggleAll() {
    onChange(allSelected ? [] : [...platforms])
  }

  function togglePlatform(platform: string) {
    onChange(
      selected.includes(platform)
        ? selected.filter((p) => p !== platform)
        : [...selected, platform],
    )
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Platforms:</label>
        <button
          type="button"
          onClick={toggleAll}
          className="admin-btn admin-btn-ghost"
          style={{ padding: '0.125rem 0.5rem', fontSize: '0.7rem' }}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {platforms.map((platform) => {
          const isSelected = selected.includes(platform)
          return (
            <label
              key={platform}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 0.5rem', borderRadius: '0.375rem', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 500,
                background: isSelected ? '#e0e7ff' : '#f1f5f9',
                color: isSelected ? '#3730a3' : '#94a3b8',
                border: `1px solid ${isSelected ? '#c7d2fe' : '#e2e8f0'}`,
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => togglePlatform(platform)}
                style={{ width: '0.75rem', height: '0.75rem', accentColor: '#4f46e5' }}
              />
              {platform}
            </label>
          )
        })}
      </div>
    </div>
  )
}
