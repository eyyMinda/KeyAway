"use client";

import { useCallback, useEffect, useState } from "react";
import { AddIcon, TrashIcon } from "@sanity/icons";
import { Box, Button, Card, Flex, Select, Spinner, Stack, Text } from "@sanity/ui";
import { useClient, useFormValue } from "sanity";
import type { StringInputProps } from "sanity";
import { apiVersion } from "@/src/sanity/env";

type ProgramRow = {
  _id: string;
  title: string;
};

function canonicalDocumentId(id: string | undefined): string | null {
  if (!id) return null;
  return id.replace(/^drafts\./, "");
}

export function VendorProgramsInput(_props: StringInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const vendorRefId = canonicalDocumentId(documentId);
  const client = useClient({ apiVersion });

  const [assigned, setAssigned] = useState<ProgramRow[]>([]);
  const [unassigned, setUnassigned] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!vendorRefId) {
      setAssigned([]);
      setUnassigned([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [assignedRows, unassignedRows] = await Promise.all([
        client.fetch<ProgramRow[]>(
          `*[_type == "program" && vendor._ref == $vendorId] | order(title asc) { _id, title }`,
          { vendorId: vendorRefId }
        ),
        client.fetch<ProgramRow[]>(
          `*[_type == "program" && !defined(vendor)] | order(title asc) { _id, title }`
        )
      ]);
      setAssigned(assignedRows ?? []);
      setUnassigned(unassignedRows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [client, vendorRefId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addProgram = async () => {
    if (!vendorRefId || !selectedProgramId) return;
    setBusy(true);
    setError(null);
    try {
      await client
        .patch(selectedProgramId)
        .set({
          vendor: { _type: "reference", _ref: vendorRefId }
        })
        .commit();
      setSelectedProgramId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign program");
    } finally {
      setBusy(false);
    }
  };

  const removeProgram = async (programId: string) => {
    if (!vendorRefId) return;
    setBusy(true);
    setError(null);
    try {
      await client.patch(programId).unset(["vendor"]).commit();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove program");
    } finally {
      setBusy(false);
    }
  };

  if (!vendorRefId) {
    return (
      <Card padding={3} radius={2} tone="transparent" border>
        <Text muted size={1}>
          Save this vendor first, then assign programs here.
        </Text>
      </Card>
    );
  }

  if (loading) {
    return (
      <Flex align="center" gap={2} padding={2}>
        <Spinner muted />
        <Text muted size={1}>
          Loading programs…
        </Text>
      </Flex>
    );
  }

  return (
    <Stack space={3}>
      <Text muted size={1}>
        Assignments are stored on each program&apos;s <strong>Vendor</strong> field. Only programs without a vendor
        appear in the add list.
      </Text>

      {error ? (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>{error}</Text>
        </Card>
      ) : null}

      <Card padding={3} radius={2} border>
        <Stack space={3}>
          <Text weight="semibold" size={1}>
            Assigned programs ({assigned.length})
          </Text>

          {assigned.length === 0 ? (
            <Text muted size={1}>
              No programs linked yet.
            </Text>
          ) : (
            <Stack space={2}>
              {assigned.map(program => (
                <Flex key={program._id} align="center" justify="space-between" gap={3}>
                  <Text size={1}>{program.title}</Text>
                  <Button
                    icon={TrashIcon}
                    mode="bleed"
                    tone="critical"
                    text="Remove"
                    disabled={busy}
                    onClick={() => void removeProgram(program._id)}
                  />
                </Flex>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      <Card padding={3} radius={2} border>
        <Stack space={3}>
          <Text weight="semibold" size={1}>
            Add program
          </Text>

          {unassigned.length === 0 ? (
            <Text muted size={1}>
              No unassigned programs available.
            </Text>
          ) : (
            <Flex gap={2} wrap="wrap">
              <Box flex={1} style={{ minWidth: "12rem" }}>
                <Select
                  fontSize={2}
                  value={selectedProgramId}
                  disabled={busy}
                  onChange={event => setSelectedProgramId(event.currentTarget.value)}>
                  <option value="">Select a program…</option>
                  {unassigned.map(program => (
                    <option key={program._id} value={program._id}>
                      {program.title}
                    </option>
                  ))}
                </Select>
              </Box>
              <Button
                icon={AddIcon}
                text="Add"
                tone="primary"
                disabled={busy || !selectedProgramId}
                onClick={() => void addProgram()}
              />
            </Flex>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
