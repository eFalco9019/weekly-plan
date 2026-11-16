import type { Profile, ProfileId } from '../types'

interface Props {
  profiles: Profile[]
  onSelect: (id: ProfileId) => void
}

export function ProfileSelector({ profiles, onSelect }: Props) {
  return (
    <div className="profile-selector">
      <span className="profile-selector__kicker">Ciclo carboidrati · allenamento</span>
      <h1>
        Energia nei giorni ON.
        <br />
        Recupero nei giorni OFF.
      </h1>
      <p>Apri il tuo piano per continuare da dove eri rimasto.</p>
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
