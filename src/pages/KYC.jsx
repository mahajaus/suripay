import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function KYC() {
  const [idFront, setIdFront] = useState(null)
  const [idBack, setIdBack] = useState(null)
  const [selfie, setSelfie] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const uploadFile = async (file, path) => {
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true })
    if (error) throw error
    return data.path
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user.id

      const frontPath = await uploadFile(idFront, `${uid}/id_front.jpg`)
      const backPath = await uploadFile(idBack, `${uid}/id_back.jpg`)
      const selfiePath = await uploadFile(selfie, `${uid}/selfie.jpg`)

      const { error: dbError } = await supabase
        .from('kyc_submissions')
        .upsert({
          user_id: uid,
          id_front_url: frontPath,
          id_back_url: backPath,
          selfie_url: selfiePath,
          status: 'pending'
        })

      if (dbError) throw dbError
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="kyc-container">
      <h2>Identiteitsverificatie</h2>
      <p>Upload je ID en selfie om je account te verifiëren.</p>

      {success ? (
        <p className="success">✅ Je documenten zijn ingediend. We controleren ze zo snel mogelijk.</p>
      ) : (
        <>
          <div className="kyc-field">
            <label>Voorkant ID</label>
            <input type="file" accept="image/*" onChange={e => setIdFront(e.target.files[0])} />
          </div>
          <div className="kyc-field">
            <label>Achterkant ID</label>
            <input type="file" accept="image/*" onChange={e => setIdBack(e.target.files[0])} />
          </div>
          <div className="kyc-field">
            <label>Selfie met ID</label>
            <input type="file" accept="image/*" onChange={e => setSelfie(e.target.files[0])} />
          </div>
          {error && <p className="error">{error}</p>}
          <button onClick={handleSubmit} disabled={loading || !idFront || !idBack || !selfie}>
            {loading ? 'Bezig...' : 'Indienen'}
          </button>
        </>
      )}
    </div>
  )
}