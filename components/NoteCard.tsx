import Link from 'next/link'

interface Note {
  id: string
  title: string
  description: string
  university: string
  department: string
  course: string
  type: string
  school_type?: string
  downloads: number
  rating: number | null
  rating_count: number
  seller_name: string
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  notes: 'Ders Notu', summary: 'Özet', past_exams: 'Çıkmış Soru',
  solved: 'Çözümlü Soru', presentation: 'Sunum', lab: 'Lab Raporu',
}

const NOTE_TYPE_COLORS: Record<string, string> = {
  notes: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  summary: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  past_exams: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  solved: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  presentation: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
  lab: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
}

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Link href={`/note/${note.id}`}>
      <div className="card p-5 h-full flex flex-col gap-3 cursor-pointer group">
        <div className="flex items-start justify-between gap-2">
          <span className={`badge ${NOTE_TYPE_COLORS[note.type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
            {NOTE_TYPE_LABELS[note.type] || note.type}
          </span>
          <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0">Ücretsiz</span>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {note.title}
          </h3>
          {note.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{note.description}</p>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{note.school_type === 'lise' ? '🏫' : note.school_type === 'ortaokul' ? '🎒' : '🎓'}</span>
            <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{note.university}</p>
          </div>
          <p className="truncate">{note.department} · {note.course}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="truncate max-w-[50%]">@{note.seller_name}</span>
          <div className="flex items-center gap-3 shrink-0">
            {note.rating !== null && note.rating_count > 0 && (
              <span className="flex items-center gap-0.5 text-yellow-500 font-medium">
                ★ {note.rating.toFixed(1)}
                <span className="text-gray-400 font-normal ml-0.5">({note.rating_count})</span>
              </span>
            )}
            <span>{note.downloads} ↓</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
