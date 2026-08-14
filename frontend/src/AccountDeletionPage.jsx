import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {ShieldAlert} from 'lucide-react'
import {api} from './lib/api'
import {useUser} from './context/UserContext'

export default function AccountDeletionPage(){
  const {logout}=useUser()
  const navigate=useNavigate()
  const [password,setPassword]=React.useState('')
  const [open,setOpen]=React.useState(false)
  const [error,setError]=React.useState('')
  const cancelRef=React.useRef(null)

  React.useEffect(()=>{
    if(!open)return
    const previous=document.activeElement
    cancelRef.current?.focus()
    const key=e=>{if(e.key==='Escape')setOpen(false)}
    document.addEventListener('keydown',key)
    return()=>{document.removeEventListener('keydown',key);previous?.focus?.()}
  },[open])

  async function remove(){
    try{
      setError('')
      await api('/account',{method:'DELETE',body:JSON.stringify({password})})
      logout(false)
      navigate('/',{replace:true})
    }catch(e){setError(e.message)}
  }

  return <main className="delete-account-page">
    <Link to="/account">← Retour à mon compte</Link>
    <section><ShieldAlert/><h1>Supprimer mon compte</h1><p>Votre identité et vos coordonnées seront anonymisées. Les commandes sont conservées uniquement pour les obligations comptables.</p><label className="field"><span>Mot de passe actuel</span><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={!password} onClick={()=>setOpen(true)}>Supprimer définitivement mon compte</button></section>
    {open&&<div className="modal-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><h2 id="delete-title">Cette action est irréversible</h2><p id="delete-description">Confirmez-vous la suppression et l’anonymisation définitive de votre compte DJIB TOUT ?</p>{error&&<div className="api-error">{error}</div>}<div><button ref={cancelRef} onClick={()=>setOpen(false)}>Conserver mon compte</button><button className="danger" onClick={remove}>Oui, supprimer</button></div></section></div>}
  </main>
}
