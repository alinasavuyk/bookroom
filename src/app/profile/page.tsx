export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Профіль</h1>
      <p className="text-gray-500">
        Тут буде аватар, ім&apos;я, список твоїх книг і рейтинг.
        Використай <code>/api/users/[id]</code> для отримання даних.
      </p>
    </div>
  );
}
