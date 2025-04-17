'use client';

import { useState } from "react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Draggable } from "@/components/Draggable";
import { PlusIcon, XMarkIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
// Import TanStack Query hooks
import { useObjectives, useCreateObjective, useUpdateObjective, useDeleteObjective } from "@/queries/useObjectives";
import { useMetrics, useCreateMetric, useUpdateMetric, useDeleteMetric } from "@/queries/useMetrics";
import { useAuth } from "@/lib/auth";

interface Metric {
  id: string;
  name: string;
  description?: string;
  type: string;
  measurement_unit: string;
}

interface Objective {
  id: string;
  name: string;
  description?: string;
}

interface ObjectivesMetricsTableProps {
  onOpen: (params: any) => void;
}

export default function ObjectivesMetricsTable({
  onOpen,
}: ObjectivesMetricsTableProps) {
  // Get current user
  const { user } = useAuth();
  const userId = user?.id || '';

  // Use TanStack Query hooks for objectives and metrics
  const { data: objectives = [], isLoading: isLoadingObjectives } = useObjectives();
  const { data: metrics = [], isLoading: isLoadingMetrics } = useMetrics();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();
  const createMetric = useCreateMetric();
  const updateMetric = useUpdateMetric();
  const deleteMetric = useDeleteMetric();

  // Dialog state management
  const [addObjectiveDialogOpen, setAddObjectiveDialogOpen] = useState(false);
  const [editObjectiveDialogOpen, setEditObjectiveDialogOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [addMetricDialogOpen, setAddMetricDialogOpen] = useState(false);
  const [editMetricDialogOpen, setEditMetricDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  
  // State for expanded objectives
  const [expandedObjectiveIds, setExpandedObjectiveIds] = useState<string[]>([]);

  const toggleObjectiveExpansion = (objectiveId: string) => {
    if (expandedObjectiveIds.includes(objectiveId)) {
      setExpandedObjectiveIds(expandedObjectiveIds.filter(id => id !== objectiveId));
    } else {
      setExpandedObjectiveIds([...expandedObjectiveIds, objectiveId]);
    }
  };

  // Objective handlers
  const handleOpenAddObjective = () => {
    setAddObjectiveDialogOpen(true);
  };

  const handleCloseAddObjective = () => {
    setAddObjectiveDialogOpen(false);
  };

  const handleOpenEditObjective = (objective: Objective) => {
    setSelectedObjective(objective);
    setEditObjectiveDialogOpen(true);
  };

  const handleCloseEditObjective = () => {
    setEditObjectiveDialogOpen(false);
    setSelectedObjective(null);
  };

  const handleSaveObjective = async (objective: { name: string; description: string }) => {
    if (selectedObjective) {
      // Edit existing objective
      await updateObjective.mutateAsync({
        id: selectedObjective.id,
        name: objective.name,
        description: objective.description
      });
      handleCloseEditObjective();
    } else {
      // Add new objective
      await createObjective.mutateAsync({
        name: objective.name,
        description: objective.description,
        user_id: userId
      });
      handleCloseAddObjective();
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    await deleteObjective.mutateAsync(objectiveId);
  };

  const handleMoveObjectiveUp = async (index: number) => {
    if (index <= 0) return;
    
    // In a real implementation, you would update the position or order field
    // For now, we'll just simulate the UI effect
    // This would require adding a position field to your objectives table
    
    // For demonstration purposes - in a real app, you'd update positions in the database
    console.log(`Move objective at index ${index} up`);
  };

  const handleMoveObjectiveDown = async (index: number) => {
    if (index >= objectives.length - 1) return;
    
    // In a real implementation, you would update the position or order field
    // For now, we'll just simulate the UI effect
    
    // For demonstration purposes - in a real app, you'd update positions in the database
    console.log(`Move objective at index ${index} down`);
  };

  // Metric handlers
  const handleOpenAddMetric = () => {
    setAddMetricDialogOpen(true);
  };

  const handleCloseAddMetric = () => {
    setAddMetricDialogOpen(false);
  };

  const handleOpenEditMetric = (metric: Metric) => {
    setSelectedMetric(metric);
    setEditMetricDialogOpen(true);
  };

  const handleCloseEditMetric = () => {
    setEditMetricDialogOpen(false);
    setSelectedMetric(null);
  };

  const handleSaveMetric = async (metric: { name: string; description: string; type: string; measurement_unit: string }) => {
    if (selectedMetric) {
      // Edit existing metric
      await updateMetric.mutateAsync({
        id: selectedMetric.id,
        name: metric.name,
        description: metric.description,
        type: metric.type,
        measurement_unit: metric.measurement_unit
      });
      handleCloseEditMetric();
    } else {
      // Add new metric
      await createMetric.mutateAsync({
        name: metric.name,
        description: metric.description,
        type: metric.type,
        measurement_unit: metric.measurement_unit,
        company_id: user?.company_id || '' // Use the user's company_id
      });
      handleCloseAddMetric();
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    await deleteMetric.mutateAsync(metricId);
  };

  const handleMoveMetricUp = async (index: number) => {
    if (index <= 0) return;
    
    // In a real implementation, you would update the position or order field
    // For now, we'll just simulate the UI effect
    
    // For demonstration purposes - in a real app, you'd update positions in the database
    console.log(`Move metric at index ${index} up`);
  };

  const handleMoveMetricDown = async (index: number) => {
    if (index >= metrics.length - 1) return;
    
    // In a real implementation, you would update the position or order field
    // For now, we'll just simulate the UI effect
    
    // For demonstration purposes - in a real app, you'd update positions in the database
    console.log(`Move metric at index ${index} down`);
  };

  // Loading state
  if (isLoadingObjectives || isLoadingMetrics) {
    return <div>Loading objectives and metrics...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Objectives and Metrics</h2>
        <div className="flex space-x-2">
          <Button onClick={handleOpenAddObjective} size="sm" variant="outline">
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Objective
          </Button>
          <Button onClick={handleOpenAddMetric} size="sm" variant="outline">
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Metric
          </Button>
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell width="60%">Name</TableCell>
            <TableCell width="40%">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {objectives.map((objective, index) => (
            <>
              <TableRow key={objective.id} className="hover:bg-gray-50">
                <TableCell>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleObjectiveExpansion(objective.id)}
                  >
                    <span className="w-4 h-4 text-gray-500 mr-2">
                      {expandedObjectiveIds.includes(objective.id) ? '−' : '+'}
                    </span>
                    <span className="font-medium">{objective.name}</span>
                  </div>
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditObjective(objective)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteObjective(objective.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleMoveObjectiveUp(index)}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={index === 0}
                  >
                    <ArrowUpIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleMoveObjectiveDown(index)}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={index === objectives.length - 1}
                  >
                    <ArrowDownIcon className="h-5 w-5" />
                  </button>
                </TableCell>
              </TableRow>
              {expandedObjectiveIds.includes(objective.id) && (
                <TableRow>
                  <TableCell colSpan={2} className="p-0 border-t-0">
                    <div className="pl-8 pr-4 py-2">
                      <p className="text-sm text-gray-600 mb-3">
                        {objective.description || "No description provided."}
                      </p>
                      <h4 className="font-medium text-sm mb-2">Related Metrics:</h4>
                      <ul className="pl-4 list-disc text-sm">
                        {metrics.filter(metric => metric.name.includes(objective.name)).map(metric => (
                          <li key={metric.id} className="mb-1">{metric.name}</li>
                        ))}
                        {metrics.filter(metric => metric.name.includes(objective.name)).length === 0 && (
                          <li className="text-gray-500">No metrics linked to this objective</li>
                        )}
                      </ul>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
          <TableRow className="border-t-2 border-gray-200">
            <TableCell colSpan={2} className="py-4">
              <h3 className="font-medium">Metrics</h3>
            </TableCell>
          </TableRow>
          {metrics.map((metric, index) => (
            <TableRow key={metric.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{metric.name}</span>
                  <span className="text-xs text-gray-500">
                    Type: {metric.type} | Unit: {metric.measurement_unit}
                  </span>
                </div>
              </TableCell>
              <TableCell className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenEditMetric(metric)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteMetric(metric.id)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleMoveMetricUp(index)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={index === 0}
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleMoveMetricDown(index)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={index === metrics.length - 1}
                >
                  <ArrowDownIcon className="h-5 w-5" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Objective Dialog */}
      <AddObjectiveDialog
        open={addObjectiveDialogOpen}
        onClose={handleCloseAddObjective}
        onSave={handleSaveObjective}
      />

      {/* Edit Objective Dialog */}
      <EditObjectiveDialog
        open={editObjectiveDialogOpen}
        onClose={handleCloseEditObjective}
        onSave={handleSaveObjective}
        objective={selectedObjective}
      />

      {/* Add Metric Dialog */}
      <AddMetricDialog
        open={addMetricDialogOpen}
        onClose={handleCloseAddMetric}
        onSave={handleSaveMetric}
      />

      {/* Edit Metric Dialog */}
      <EditMetricDialog
        open={editMetricDialogOpen}
        onClose={handleCloseEditMetric}
        onSave={handleSaveMetric}
        metric={selectedMetric}
      />
    </div>
  );
}

// Dialog Components
function AddObjectiveDialog({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    onSave({ name, description });
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Objective</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Objective Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="outlined"
          className="mb-4"
        />
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditObjectiveDialog({ open, onClose, onSave, objective }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Set initial values when objective changes
  useState(() => {
    if (objective) {
      setName(objective.name || "");
      setDescription(objective.description || "");
    }
  });

  // Update form values when objective changes
  useState(() => {
    if (objective) {
      setName(objective.name || "");
      setDescription(objective.description || "");
    }
  }, [objective]);

  const handleSubmit = () => {
    onSave({ name, description });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Objective</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Objective Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="outlined"
          className="mb-4"
        />
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddMetricDialog({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("numeric");
  const [measurementUnit, setMeasurementUnit] = useState("");

  const handleSubmit = () => {
    onSave({
      name,
      description,
      type,
      measurement_unit: measurementUnit,
    });
    setName("");
    setDescription("");
    setType("numeric");
    setMeasurementUnit("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Metric</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Metric Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="outlined"
          className="mb-4"
        />
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
          className="mb-4"
        />
        <FormControl fullWidth margin="dense" className="mb-4">
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value)}
          >
            <MenuItem value="numeric">Numeric</MenuItem>
            <MenuItem value="percentage">Percentage</MenuItem>
            <MenuItem value="currency">Currency</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="Measurement Unit"
          type="text"
          fullWidth
          value={measurementUnit}
          onChange={(e) => setMeasurementUnit(e.target.value)}
          variant="outlined"
          placeholder="e.g. $, %, units"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name || !type || !measurementUnit}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditMetricDialog({ open, onClose, onSave, metric }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("numeric");
  const [measurementUnit, setMeasurementUnit] = useState("");

  // Set initial values when metric changes
  useState(() => {
    if (metric) {
      setName(metric.name || "");
      setDescription(metric.description || "");
      setType(metric.type || "numeric");
      setMeasurementUnit(metric.measurement_unit || "");
    }
  });

  // Update form values when metric changes
  useState(() => {
    if (metric) {
      setName(metric.name || "");
      setDescription(metric.description || "");
      setType(metric.type || "numeric");
      setMeasurementUnit(metric.measurement_unit || "");
    }
  }, [metric]);

  const handleSubmit = () => {
    onSave({
      name,
      description,
      type,
      measurement_unit: measurementUnit,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Metric</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Metric Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="outlined"
          className="mb-4"
        />
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
          className="mb-4"
        />
        <FormControl fullWidth margin="dense" className="mb-4">
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value)}
          >
            <MenuItem value="numeric">Numeric</MenuItem>
            <MenuItem value="percentage">Percentage</MenuItem>
            <MenuItem value="currency">Currency</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="Measurement Unit"
          type="text"
          fullWidth
          value={measurementUnit}
          onChange={(e) => setMeasurementUnit(e.target.value)}
          variant="outlined"
          placeholder="e.g. $, %, units"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name || !type || !measurementUnit}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
