import React from 'react'
import {Link,useNavigate} from 'react-router-dom'
import {ArrowRight,BarChart3,Check,LockKeyhole,Mail,ShieldCheck,Store,UserRound} from 'lucide-react'
import {api} from './lib/api'
import {useUser} from './context/UserContext'
import './seller-auth.css'

export default function SellerAuth({mode='register'}){
  const navigate=useNavigate()
  const {login,logout}=useUser()
  const register=mode==='register'
  const [form,setForm]=React.useState({name:'',email:'',password:'',confirm:'',businessName:'',phone:''})
  const [error,setError]=React.useState('')
  const [message,setMessage]=React.useState('')
  const [busy,setBusy]=React.useState(false)
  const change=e=>setForm({...form,[e.target.name]:e.target.value})

  async function submit(e){
    e.preventDefault();setBusy(true);setError('')
    try{
      if(register){
        if(form.password!==form.confirm)throw new Error('Les mots de passe ne correspondent pas.')
        const data=await api('/auth/register',{method:'POST',body:JSON.stringify({name:form.name,email:form.email,password:form.password,role:'SELLER'})})
        setMessage(data.message);setTimeout(()=>navigate('/vendeur/login'),1200)
      }else{
        const user=await login(form.email,form.password)
        if(user.role!=='SELLER'&&user.role!=='ADMIN'){
          logout(false)
          throw new Error('Ce compte ne possède pas d’espace vendeur.')
        }
        navigate('/seller',{replace:true})
      }
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  return <div className="seller-auth">
    <aside><Link to="/vendeur" className="seller-logo"><span>DT</span><b>DJIB<em>TOUT</em><small>VENDEURS</small></b></Link><div><span>ESPACE PROFESSIONNEL</span><h1>{register?'Transformez votre activité en boutique en ligne.':'Retrouvez votre boutique et vos commandes.'}</h1><p>{register?'Rejoignez la plateforme qui connecte les commerçants locaux aux acheteurs de Djibouti.':'Pilotez produits, ventes, stocks et règlements depuis votre espace sécurisé.'}</p><ul><li><Check/> Boutique professionnelle</li><li><BarChart3/> Statistiques de vente</li><li><ShieldCheck/> Paiements sécurisés</li></ul></div><small>DJIB TOUT Vendeurs · Assistance locale</small></aside>
    <main><Link className="seller-auth-back" to="/vendeur">← Retour à l’espace vendeur</Link><form onSubmit={submit}><div className="seller-auth-heading"><i><Store/></i><span><small>{register?'OUVERTURE DE BOUTIQUE':'CONNEXION VENDEUR'}</small><h2>{register?'Créez votre compte vendeur':'Bon retour parmi nous'}</h2><p>{register?'Première étape avant la création de votre boutique.':'Accédez à votre tableau de bord professionnel.'}</p></span></div>{error&&<div className="api-error">{error}</div>}{message&&<div className="api-success">{message}</div>}{register&&<><label><span><UserRound/> Nom du responsable</span><input name="name" value={form.name} onChange={change} placeholder="Votre nom complet" required/></label><label><span><Store/> Nom commercial</span><input name="businessName" value={form.businessName} onChange={change} placeholder="Nom de votre activité" required/></label></>}<label><span><Mail/> Adresse e-mail professionnelle</span><input name="email" type="email" value={form.email} onChange={change} placeholder="contact@votreboutique.com" required/></label>{register&&<label><span>Téléphone professionnel</span><input name="phone" value={form.phone} onChange={change} placeholder="77 00 00 00" required/></label>}<label><span><LockKeyhole/> Mot de passe</span><input name="password" type="password" minLength="8" value={form.password} onChange={change} required/></label>{register&&<label><span><LockKeyhole/> Confirmer le mot de passe</span><input name="confirm" type="password" minLength="8" value={form.confirm} onChange={change} required/></label>}{!register&&<Link className="seller-forgot" to="/forgot-password">Mot de passe oublié ?</Link>}<button disabled={busy}>{busy?'Veuillez patienter…':register?'Continuer vers ma boutique':'Accéder au tableau de bord'}<ArrowRight/></button><small className="seller-auth-switch">{register?'Déjà vendeur ?':'Vous souhaitez vendre ?'} <Link to={register?'/vendeur/login':'/vendeur/register'}>{register?'Se connecter':'Créer ma boutique'}</Link></small>{register&&<p className="seller-terms">En continuant, vous acceptez les conditions vendeurs DJIB TOUT.</p>}</form></main>
  </div>
}
