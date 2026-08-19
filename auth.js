(function(root){
  'use strict';
  let client=null;
  function configured(){const c=root.BAKERY_WS_CONFIG||{};return !!(c.supabaseUrl&&c.supabasePublishableKey&&root.supabase)}
  function getClient(){if(!configured())return null;if(!client)client=root.supabase.createClient(root.BAKERY_WS_CONFIG.supabaseUrl,root.BAKERY_WS_CONFIG.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client}
  async function currentSession(){const local=root.BakeryWSStore?.session?.();if(local?.mode==='preview')return local;const c=getClient();if(!c)return null;const {data}=await c.auth.getSession();return data?.session?{mode:'account',email:data.session.user.email,userId:data.session.user.id}:null}
  async function signIn(email,password){const c=getClient();if(!c)throw new Error('Account backend is not connected yet. Use Preview mode while the backend is being configured.');const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;return{mode:'account',email:data.user.email,userId:data.user.id}}
  async function signUp(email,password){const c=getClient();if(!c)throw new Error('Account backend is not connected yet. Use Preview mode while the backend is being configured.');const {data,error}=await c.auth.signUp({email,password});if(error)throw error;return{mode:'account',email:data.user?.email||email,userId:data.user?.id||''}}
  async function signOut(){const local=root.BakeryWSStore?.session?.();if(local?.mode==='preview'){root.BakeryWSStore.setSession(null);return}const c=getClient();if(c)await c.auth.signOut();root.BakeryWSStore?.setSession?.(null)}
  function preview(){const session={mode:'preview',email:'preview@bakeryws.app',userId:'preview'};root.BakeryWSStore.setSession(session);return session}
  root.BakeryWSAuth={configured,currentSession,signIn,signUp,signOut,preview};
})(typeof globalThis!=='undefined'?globalThis:this);