import React from 'react'
import {Link} from 'react-router-dom'
import {AlertTriangle,ArrowRight,Box,ChevronRight,CircleDollarSign,ClipboardList,MessageSquare,Package,Plus,Star,Store,TrendingUp} from 'lucide-react'
import {api} from './lib/api'
import {useUser} from './context/UserContext'
import './seller-dashboard.css'

const money=value=>new Intl.NumberFormat('fr-FR').format(Number(value||0))+' FDJ'
const status={PENDING:'En attente',PAID:'Payée',PROCESSING:'En préparation',SHIPPED:'Expédiée',DELIVERED:'Livrée',CANCELLED:'Annulée'}

export default function SellerDashboardHome(){
  const {user}=useUser(),[data,setData]=React.useState(null),[orders,setOrders]=React.useState([]),[analytics,setAnalytics]=React.useState(null),[store,setStore]=React.useState(null),[error,setError]=React.useState('')
  React.useEffect(()=>{Promise.all([api('/seller/dashboard'),api('/seller/orders'),api('/seller/analytics?days=30'),api('/seller/store')]).then(([dashboard,recent,stats,shop])=>{setData(dashboard);setOrders(recent);setAnalytics(stats);setStore(shop)}).catch(e=>setError(e.message))},[])
  if(error)return <div className="portal-content"><div className="api-error">Impossible de charger le tableau de bord : {error}</div></div>
  if(!data)return <div className="portal-content seller-dash-loading"><span/><p>Chargement de votre activité…</p></div>
  const cards=[
    [CircleDollarSign,"Chiffre d’affaires",money(data.revenue),money(analytics?.revenue)+' sur 30 jours'],
    [ClipboardList,'Commandes',data.orders,`${orders.filter(x=>x.status==='PENDING').length} à traiter`],
    [Package,'Produits',data.products,`${data.lowStock} en stock faible`],
    [Star,'Service client',data.pendingQuestions+data.pendingReviews,`${data.pendingQuestions} questions · ${data.pendingReviews} avis`]
  ]
  return <div className="portal-content seller-dashboard-live">
    <div className="seller-welcome"><div><small>BOUTIQUE VALIDÉE</small><h1>Bonjour, {user?.name?.split(' ')[0]} 👋</h1><p>Voici l’activité réelle de <b>{store?.name}</b> aujourd’hui.</p></div><Link to="/seller/products"><Plus/> Ajouter un produit</Link></div>
    <div className="kpis">{cards.map(([Icon,label,value,note])=><article key={label}><i><Icon/></i><span><small>{label}</small><b>{value}</b><em>{note}</em></span></article>)}</div>
    {(data.lowStock>0||data.outOfStock>0)&&<div className="seller-stock-alert"><AlertTriangle/><span><b>Votre stock demande votre attention</b><small>{data.lowStock} produit(s) presque épuisé(s) et {data.outOfStock} en rupture.</small></span><Link to="/seller/products">Gérer le stock <ArrowRight/></Link></div>}
    <div className="seller-dash-main"><section className="panel"><header><div><h2>Commandes récentes</h2><p>Les dernières commandes contenant vos produits.</p></div><Link to="/seller/orders">Toutes les commandes <ChevronRight/></Link></header>{orders.length?<div className="seller-order-table"><div className="head"><span>Commande</span><span>Date</span><span>Montant</span><span>Statut</span></div>{orders.slice(0,6).map(order=><div key={order.fulfillmentId}><b>#DT-{order.orderId}</b><span>{order.createdAt?new Date(order.createdAt).toLocaleDateString('fr-FR'):'—'}</span><strong>{money(order.subtotal)}</strong><em className={'seller-order-status '+String(order.status).toLowerCase()}>{status[order.status]||order.status}</em></div>)}</div>:<div className="seller-empty"><ClipboardList/><b>Aucune commande pour le moment</b><p>Vos nouvelles commandes apparaîtront ici.</p></div>}</section>
      <aside className="panel seller-actions"><h2>Actions rapides</h2><Link to="/seller/products"><i><Box/></i><span><b>Ajouter un produit</b><small>Compléter votre catalogue</small></span><ChevronRight/></Link><Link to="/seller/orders"><i><ClipboardList/></i><span><b>Traiter les commandes</b><small>{orders.filter(x=>x.status==='PENDING').length} commande(s) en attente</small></span><ChevronRight/></Link><Link to="/seller/questions"><i><MessageSquare/></i><span><b>Répondre aux clients</b><small>{data.pendingQuestions} question(s) sans réponse</small></span><ChevronRight/></Link><Link to="/seller/store"><i><Store/></i><span><b>Modifier la boutique</b><small>Logo, description et conditions</small></span><ChevronRight/></Link></aside>
    </div>
    <div className="seller-insight panel"><span><TrendingUp/></span><div><small>PERFORMANCE SUR 30 JOURS</small><h2>{money(analytics?.revenue)} de ventes</h2><p>{analytics?.orders||0} commande(s), panier moyen de {money(analytics?.averageOrder)} et taux de retour de {analytics?.returnRate||0}%.</p></div><Link to="/seller/analytics">Voir les statistiques <ArrowRight/></Link></div>
  </div>
}
