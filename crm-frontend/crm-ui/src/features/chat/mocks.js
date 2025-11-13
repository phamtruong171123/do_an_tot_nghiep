export const me = { id:"u_me", name:"Sierra Ferguson", email:"s.ferguson@gmail.com", avatarUrl:"https://i.pravatar.cc/64?img=15" };
export const threadsMock = [
  { id:"t1", title:"Lindsey Stroud", lastMessageSnippet:"Your idea for this application is nice!", updatedAt:"2018-12-30T12:34:00Z", unread:1, participants:[{ id:"u1", name:"Lindsey Stroud", avatarUrl:"https://i.pravatar.cc/64?img=11" }] },
  { id:"t2", title:"Nicci Troiani", lastMessageSnippet:"is typing a message…", updatedAt:"2018-12-30T11:12:00Z", unread:2, participants:[{ id:"u2", name:"Nicci Troiani", avatarUrl:"https://i.pravatar.cc/64?img=32" }] },
  { id:"t3", title:"WordPress conferesion", lastMessageSnippet:"You: Sure!", updatedAt:"2018-12-29T18:05:00Z", unread:0, iconUrl:"https://cdn.simpleicons.org/wordpress/21759B", participants:[{ id:"u3", name:"WP Team" }] },
];
export const msgsMock = [
  { id:"m1", threadId:"t1", from:{ id:"u1", name:"Lindsey Stroud", avatarUrl:"https://i.pravatar.cc/64?img=11" }, text:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt…", sentAt:"2018-12-30T11:12:00Z", status:"read", isMine:false },
  { id:"m2", threadId:"t1", from:me, text:"Your idea for this application is nice!", sentAt:"2018-12-30T11:12:30Z", status:"read", isMine:true },
];
