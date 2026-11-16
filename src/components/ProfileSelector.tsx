import type { Profile, ProfileId } from '../types'

interface Props {
  profiles: Profile[]
  onSelect: (id: ProfileId) => void
}

export function ProfileSelector({ profiles, onSelect }: Props) {
  return (
    <div className="profile-selector">
      <h1>Piano nutrizionale</h1>
      <p>Chi sei?</p>
      <div className="profile-selector__options">
        {profiles.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)}>
            {p.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
