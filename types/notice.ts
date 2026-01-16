export interface NoticeLike {
  uid: string;
  name: string;
  email?: string;
}

export interface NoticePost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  tags?: string[];
  likes?: NoticeLike[];
  createdAt: string;
  updatedAt?: string;
}
