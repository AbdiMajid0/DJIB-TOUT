import React, {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {api} from '../lib/api'

const UserContext = createContext(null)
export function UserProvider({children}) {
  const [user,setUser] = useState(()=>JSON.parse(localStorage.getItem('dt.user') || 'null'))
  const [cart,setCart] = useState(()=>JSON.parse(localStorage.getItem('dt.cart') || '[]'))
  const [favoriteIds,setFavoriteIds] = useState([])
  const [checking,setChecking] = useState(()=>Boolean(localStorage.getItem('dt.accessToken')))
  useEffect(()=>localStorage.setItem('dt.cart',JSON.stringify(cart)),[cart])
  useEffect(()=>{if(!user)return;api('/favorites/ids').then(setFavoriteIds).catch(()=>setFavoriteIds([]))},[user])
  // Au démarrage, toute erreur de `/auth/me` déconnectait — y compris une panne
  // serveur ou une coupure réseau. On ne déconnecte plus que sur un vrai 401 ;
  // sinon on repart de la session mémorisée, quitte à la revalider plus tard.
  useEffect(()=>{if(!localStorage.getItem('dt.accessToken')){setChecking(false);return}api('/auth/me').then(value=>{setUser(value);localStorage.setItem('dt.user',JSON.stringify(value))}).catch(error=>{if(error?.status===401){logout(false);return}const memorise=localStorage.getItem('dt.user');if(memorise)try{setUser(JSON.parse(memorise))}catch{/* entrée illisible */}}).finally(()=>setChecking(false))},[])
  useEffect(()=>{const out=()=>logout(false);window.addEventListener('dt:unauthorized',out);return()=>window.removeEventListener('dt:unauthorized',out)},[])
  async function login(email,password){const data=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem('dt.accessToken',data.token);localStorage.setItem('dt.refreshToken',data.refreshToken);const value={name:data.name,email:data.email,role:data.role};localStorage.setItem('dt.user',JSON.stringify(value));setUser(value);return value}
  async function register(name,email,password){return api('/auth/register',{method:'POST',body:JSON.stringify({name,email,password,role:'BUYER'})})}
  function logout(callApi=true){const refreshToken=localStorage.getItem('dt.refreshToken');if(callApi&&refreshToken)api('/auth/logout',{method:'POST',body:JSON.stringify({refreshToken})}).catch(()=>{});localStorage.removeItem('dt.accessToken');localStorage.removeItem('dt.refreshToken');localStorage.removeItem('dt.user');setUser(null);setFavoriteIds([])}
  function addToCart(product,quantity=1,variant=null){const key=`${product.id}:${variant?.id||'base'}`;setCart(items=>{const found=items.find(x=>(x.key||`${x.product.id}:base`)===key),limit=variant?.stockQuantity??product.stockQuantity??99;return found?items.map(x=>(x.key||`${x.product.id}:base`)===key?{...x,quantity:Math.min(x.quantity+quantity,limit)}:x):[...items,{key,product,variant,quantity}]})}
  function updateCart(id,quantity){setCart(items=>quantity<1?items.filter(x=>x.product.id!==id):items.map(x=>x.product.id===id?{...x,quantity}:x))}
  async function toggleFavorite(id){if(!user)throw new Error('Connectez-vous pour gérer vos favoris.');const active=favoriteIds.includes(id);await api(`/favorites/${id}`,{method:active?'DELETE':'POST'});setFavoriteIds(ids=>active?ids.filter(x=>x!==id):[...ids,id])}
  const value=useMemo(()=>({user,checking,cart,favoriteIds,login,register,logout,addToCart,updateCart,toggleFavorite,setCart}),[user,checking,cart,favoriteIds])
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
export const useUser=()=>useContext(UserContext)
