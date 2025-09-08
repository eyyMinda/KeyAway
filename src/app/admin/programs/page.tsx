"use client";

import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import { useState, useEffect } from "react";
import { client } from "@/src/sanity/lib/client";
import { allProgramsQuery } from "@/src/lib/queries";
import { Program } from "@/src/types/ProgramType";
import Link from "next/link";
import { IdealImage } from "@/src/components/general/IdealImage";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const programsData: Program[] = await client.fetch(allProgramsQuery);
        setPrograms(programsData);
      } catch (error) {
        console.error("Error fetching programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const filteredPrograms = programs.filter(
    program =>
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.slug.current.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedAdminLayout title="Programs" subtitle="Manage CD key programs and content">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading programs...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout title="Programs" subtitle="Manage CD key programs and content">
      {/* Search and Actions */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Program
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map(program => (
          <div
            key={program.slug.current}
            className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
            {/* Program Image */}
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {program.image ? (
                <IdealImage image={program.image} alt={program.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-6xl">🎮</div>
              )}
            </div>

            {/* Program Content */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{program.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>

              {/* Program Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{program.cdKeys?.length || 0}</span> CD Keys
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">
                    {program.cdKeys?.filter(key => key.status === "active" || key.status === "new").length || 0}
                  </span>{" "}
                  Working
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/program/${program.slug.current}`}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center">
                  View
                </Link>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Edit
                </button>
                <button className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎮</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No programs found" : "No programs available"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? "Try adjusting your search terms." : "Get started by adding your first program."}
          </p>
          {!searchTerm && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add Program
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Programs</p>
              <p className="text-2xl font-bold text-gray-900">{programs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">🔑</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total CD Keys</p>
              <p className="text-2xl font-bold text-gray-900">
                {programs.reduce((total, program) => total + (program.cdKeys?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Working Keys</p>
              <p className="text-2xl font-bold text-gray-900">
                {programs.reduce(
                  (total, program) =>
                    total +
                    (program.cdKeys?.filter(key => key.status === "active" || key.status === "new").length || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedAdminLayout>
  );
}
