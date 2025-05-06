import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-purple-800 mb-8">Welcome to Trackly</h1>
          <p className="text-gray-600 mb-12">Your all-in-one tracking solution</p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href='/admin/register'
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
            >
              Admin Register
            </Link>
            <Link 
              href='/user/register'
              className="px-8 py-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors duration-200 font-medium"
            >
              User Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
