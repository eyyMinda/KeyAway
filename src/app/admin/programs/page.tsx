"use client";

import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import SearchInput from "@/src/components/ui/SearchInput";
import { useState, useEffect, useCallback } from "react";
import { client } from "@/src/sanity/lib/client";
import { adminProgramsQuery } from "@/src/lib/queries";
import { Program } from "@/src/types";
import Link from "next/link";
import { FaWrench } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";
import ProgramEditModal from "@/src/components/admin/programs/ProgramEditModal";
import FeaturedProgramSettings from "@/src/components/admin/programs/FeaturedProgramSettings";
import { getWorkingKeysCount } from "@/src/lib/adminHelpers";

type ProgramFilter = "all" | "no-working-keys" | "has-working-keys";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ProgramFilter>("all");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const programsData: Program[] = await client.fetch(adminProgramsQuery);
      setPrograms(programsData);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const filteredPrograms = programs
    .filter(
      program =>
        program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.slug.current.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(program => {
      if (filter === "all") return true;
      const working = getWorkingKeysCount(program.cdKeys);
      if (filter === "no-working-keys") return working === 0;
      return working > 0;
    });

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
      {/* Featured Program Settings */}
      <FeaturedProgramSettings
        programs={programs}
        onProgramClick={program => {
          setSelectedProgram(program);
          setEditModalOpen(true);
        }}
      />

      {/* Search and Actions */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search programs..." />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as ProgramFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm cursor-pointer">
                <option value="all">All programs</option>
                <option value="no-working-keys">No working keys</option>
                <option value="has-working-keys">Has working keys</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSelectedProgram(null);
                  setEditModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                Add Program
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map(program => (
          <div
            key={program._id ?? program.slug.current}
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
                  <span className="font-medium">{getWorkingKeysCount(program.cdKeys)}</span> Working
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/program/${program.slug.current}`}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center cursor-pointer">
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProgram(program);
                    setEditModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  <FaWrench className="shrink-0" size={14} />
                  Edit
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
            {searchTerm || filter !== "all" ? "No programs found" : "No programs available"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filter."
              : "Get started by adding your first program."}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSelectedProgram(null);
                setEditModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              Add Program
            </button>
          )}
        </div>
      )}

      <ProgramEditModal
        program={selectedProgram}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProgram(null);
        }}
        onSaved={() => {
          fetchPrograms();
          setEditModalOpen(false);
          setSelectedProgram(null);
        }}
        onDeleted={() => {
          fetchPrograms();
          setEditModalOpen(false);
          setSelectedProgram(null);
        }}
      />

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
                {programs.reduce((total, program) => total + getWorkingKeysCount(program.cdKeys), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedAdminLayout>
  );
}
