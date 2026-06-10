export const seedUsers = [
  { id: 'u1', name: 'Memelord', handle: 'memelord', avatar: 'https://robohash.org/memelord?set=set4&size=80x80', bio: 'CEO of meme energy' },
  { id: 'u2', name: 'GifQueen', handle: 'gifqueen', avatar: 'https://robohash.org/gifqueen?set=set2&size=80x80', bio: 'Loop specialist' },
  { id: 'u3', name: 'DankBrain', handle: 'dankbrain', avatar: 'https://robohash.org/dankbrain?set=set3&size=80x80', bio: 'Night shift creator' }
];

export const seedPosts = [
  { id: 'p1', userId: 'u1', title: 'Deploy mood', caption: 'When prod survives first push', imageUrl: 'https://i.imgflip.com/30b1gx.jpg', likes: ['u2'], shares: 2, remixOf: null, createdAt: Date.now() - 86400000 },
  { id: 'p2', userId: 'u2', title: 'Standup reality', caption: 'One update, ten followups', imageUrl: 'https://i.imgflip.com/26am.jpg', likes: ['u1','u3'], shares: 3, remixOf: null, createdAt: Date.now() - 76000000 },
  { id: 'p3', userId: 'u3', title: '2AM fix', caption: 'No idea why, but fixed', imageUrl: 'https://i.imgflip.com/1otk96.jpg', likes: [], shares: 1, remixOf: 'p1', createdAt: Date.now() - 3600000 }
];

export const seedComments = [
  { id: 'c1', postId: 'p1', userId: 'u2', text: 'Accurate.', createdAt: Date.now() - 80000000 },
  { id: 'c2', postId: 'p2', userId: 'u1', text: 'Happens daily.', createdAt: Date.now() - 70000000 }
];
