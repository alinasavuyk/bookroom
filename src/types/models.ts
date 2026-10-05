export interface BookOwner {
  _id: string;
  name: string;
  avatar?: string;
  rating?: number;
}

export interface BookSummary {
  _id: string;
  title: string;
  author: string;
  coverImage?: string;
  price: number;
  avgRating?: number;
  reviewCount?: number;
  type: 'sale' | 'exchange' | 'both';
  status: 'available' | 'reserved' | 'sold';
  owner?: BookOwner;
}

export interface BookDetail extends BookSummary {
  description: string;
  genres: string[];
  owner: BookOwner;
}

export interface CommentAuthor {
  _id: string;
  name: string;
  avatar?: string;
}

export interface CommentDTO {
  _id: string;
  text: string;
  rating?: number;
  author: CommentAuthor;
  createdAt: string;
}

export interface MessageBookRef {
  _id: string;
  title: string;
  coverImage?: string;
  price: number;
}

export interface MessageDTO {
  _id: string;
  sender: string;
  receiver: string;
  book?: MessageBookRef;
  offeredBook?: MessageBookRef;
  offerStatus?: 'pending' | 'accepted' | 'declined';
  text: string;
  read: boolean;
  createdAt: string;
}

export interface OrderParty {
  _id: string;
  name: string;
  avatar?: string;
}

export interface OrderDTO {
  _id: string;
  bookTitle: string;
  bookCoverImage?: string;
  price: number;
  city: string;
  warehouse: string;
  paymentMethod: 'cash' | 'card' | 'cod';
  status: 'active' | 'confirmed' | 'cancelled';
  buyer: OrderParty;
  seller: OrderParty;
  createdAt: string;
}

export interface ConversationDTO {
  userId: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
