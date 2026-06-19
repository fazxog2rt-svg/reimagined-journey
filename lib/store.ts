import { students as initialStudents, Student } from './students'

// Single shared mutable store used by both check and admin routes
export let studentsStore: Student[] = [...initialStudents]

export function updateStudent(id: number, data: Partial<Student>): Student | null {
  const index = studentsStore.findIndex(s => s.id === id)
  if (index === -1) return null
  const updated = { ...studentsStore[index], ...data }
  if (updated.status === 'LULUS') delete updated.keterangan
  studentsStore[index] = updated
  return studentsStore[index]
}

export function addStudent(data: Omit<Student, 'id'>): Student {
  const newStudent: Student = {
    id: Math.max(...studentsStore.map(s => s.id), 0) + 1,
    ...data,
  }
  studentsStore.push(newStudent)
  return newStudent
}

export function deleteStudent(id: number): boolean {
  const before = studentsStore.length
  studentsStore = studentsStore.filter(s => s.id !== id)
  return studentsStore.length < before
}
