import React, { useMemo, useEffect } from "react";
import { useTable, useSortBy } from "react-table";
import { Table, Tbody, Td, Th, Thead, Tr, chakra } from "@chakra-ui/react";
import processSchoolRow from "./processSchoolRow";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import SetupMenuColumn from "./SetupMenuColumn";

let globalRowNum;

const CreateReactTableForSchool = ({
	schoolData,
	triggerSearch,
	countries,
	statuses,
	persons,
}) => {
	globalRowNum = 0; // Unique Row Number
	// Prepare the data for React Table
	const reactTableColumns = useMemo(
		() => [
			{
				Header: "Country",
				accessor: "country", // accessor is the "key" in the data
			},
			{
				Header: "Name",
				accessor: "name",
			},
			{
				Header: "Location",
				accessor: "location",
			},
			{
				Header: "Description",
				accessor: "description",
			},
			{
				Header: "Person Responsible",
				accessor: "full_name",
			},
			{
				Header: "Status",
				accessor: "status",
			},
			{
				Header: "Deployment Date",
				accessor: "deploymentdate",
				sortType: (a, z) => {
					return (
						a.values.deploymentdate_sortvalue -
						z.values.deploymentdate_sortvalue
					);
				},
			},
			{
				Header: "hide-date", // Hidden: for sorting purposes only - see above
				accessor: "deploymentdate_sortvalue",
				isVisible: true,
			},
			{
				Header: "Created At",
				accessor: "created_at",
			},
			{
				Header: "Edit",
				accessor: "edit",
				disableSortBy: true,
				Cell: function renderCell() {
					return (
						<SetupMenuColumn
							triggerSearch={triggerSearch}
							countries={countries.data}
							statuses={statuses.data}
							persons={persons}
							schoolData={schoolData[globalRowNum++]} // Incremented
						/>
					);
				},
			},
		],
		[countries, persons, schoolData, statuses, triggerSearch]
	);

	const reactTableData = useMemo(
		() => schoolData.map((element) => processSchoolRow(element)),
		[schoolData]
	);

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		rows,
		prepareRow,
		setHiddenColumns,
	} = useTable(
		{
			columns: reactTableColumns,
			data: reactTableData,
			hiddenColumns: reactTableColumns
				.filter((column) => !column.isVisible)
				.map((column) => column.accessor),
		},
		useSortBy
	);

	// According to the complex React-Table documentation, this is the only way to hide a column
	// See @ggascoigne AT https://github.com/TanStack/table/issues/1804
	// https://codesandbox.io/s/relaxed-night-y5gcl?file=/src/App.js:980-985

	useEffect(() => {
		setHiddenColumns(
			reactTableColumns
				.filter((column) => column.isVisible)
				.map((column) => column.accessor)
		);
	}, [setHiddenColumns, reactTableColumns]);

	return (
		<Table variant="striped" {...getTableProps()}>
			<Thead>
				{headerGroups.map((headerGroup, index) => (
					<Tr key={index} {...headerGroup.getHeaderGroupProps()}>
						{headerGroup.headers.map((column) => (
							<Th
								key={index}
								{...column.getHeaderProps(column.getSortByToggleProps())}
							>
								{column.render("Header")}
								<chakra.span pl="4">
									{column.isSorted ? (
										column.isSortedDesc ? (
											<TriangleDownIcon aria-label="sorted descending" />
										) : (
											<TriangleUpIcon aria-label="sorted ascending" />
										)
									) : null}
								</chakra.span>
							</Th>
						))}
					</Tr>
				))}
			</Thead>
			<Tbody {...getTableBodyProps()}>
				{rows.map((row, index) => {
					prepareRow(row);
					return (
						<Tr key={index} {...row.getRowProps()}>
							{row.cells.map((cell, index) => (
								<Td key={index} {...cell.getCellProps()}>
									{cell.render("Cell")}
								</Td>
							))}
						</Tr>
					);
				})}
			</Tbody>
		</Table>
	);
};

export default CreateReactTableForSchool;
