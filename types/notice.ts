export interface NoticePost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}
