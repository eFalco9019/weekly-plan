import type { Profile, ProfileId } from '../types'

interface Props {
  profiles: Profile[]
  onSelect: (id: ProfileId) => void
}

export function ProfileSelector({ profiles, onSelect }: Props) {
  return (
    <div className="profile-selector">
      <h1>
        Energia nei giorni ON.
        <br />
        Recupero nei giorni OFF.
      </h1>
      <p>Di chi è il piano da aprire?</p>
      <div className="profile-selector__options">
        {profiles.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)}>
            <span className="profile-selector__avatar">{p.nome.charAt(0)}</span>
            {p.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
