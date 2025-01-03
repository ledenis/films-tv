import './App.css'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

export interface RatingsInfo {
  /** out of 100 */
  rottenRating?: number
  /** out of 10 */
  imdbRating?: number
}

interface Movie {
  title: string
  directors: string[]
  categories: string[]
  iconUrl: string
  startDateTime: string
  stopDateTime: string
  channelId: string
  ratingsInfo: RatingsInfo
}

interface MoviesResponse {
  lastUpdateDateTime: string
  movies: Movie[]
}

async function getMovies(): Promise<MoviesResponse> {
  const res = await fetch('https://ledenis.github.io/films-tv-data/movies.json')
  const json = await res.json()
  return json
}

const columnHelper = createColumnHelper<Movie>()

const columns = [
  columnHelper.accessor((row) => row.title, {
    header: 'Titre',
    cell: (info) => {
      const searchQuery = `${info.getValue()} ${info.row.original.directors[0]}`
      return (
        <b>
          <a target="_blank" href={`https://google.fr/search?q=${encodeURIComponent(searchQuery)}`}>
            {info.getValue()}
          </a>
        </b>
      )
    },
  }),
  columnHelper.accessor((row) => row.iconUrl, {
    header: 'Image',
    cell: (info) => <img width={200} src={info.getValue()} />,
  }),
  columnHelper.accessor((row) => row.channelId, {
    header: 'Chaîne',
  }),
  columnHelper.accessor((row) => row.ratingsInfo.rottenRating, {
    header: 'Score Rotten Tomatoes',
    cell: (info) => (info.getValue() ? `${info.getValue()}%` : '-'),
  }),
  columnHelper.accessor((row) => row.ratingsInfo.imdbRating, {
    header: 'Score IMDb',
    cell: (info) => (info.getValue() ? `${info.getValue()}/10` : '-'),
  }),
  columnHelper.accessor((row) => row.startDateTime, {
    id: 'startDateTime',
    header: 'Heure',
    cell: (info) => (
      <span
        title={`${new Date(info.getValue()).toLocaleTimeString()} - ${new Date(
          info.row.original.stopDateTime
        ).toLocaleTimeString()}`}
      >
        {new Date(info.getValue()).toLocaleString()}
      </span>
    ),
    filterFn: (row, _columnId, _filterValue) => {
      // keep only dates after 1 hour ago
      const startTimeStamp = new Date(row.original.startDateTime).getTime()
      const nowTimeStamp = new Date().getTime()
      const oneHour = 60 * 60 * 1000
      if (nowTimeStamp - oneHour < startTimeStamp) {
        return true
      }
      return false
    },
  }),
]

const fallbackData: Movie[] = []

function App() {
  const { isPending, error, data } = useQuery({ queryKey: ['movies'], queryFn: getMovies })

  const table = useReactTable({
    columns,
    data: data?.movies ?? fallbackData,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      sorting: [
        {
          id: 'startDateTime',
          desc: false,
        },
      ],
      columnFilters: [
        {
          id: 'startDateTime',
          value: 'dummy', // for enabling filter on column
        },
      ],
    },
  })

  return (
    <>
      <header>
        <h1>📺 Films TV</h1>
      </header>
      <div>
        {isPending ? (
          <span>Loading...</span>
        ) : error ? (
          <span>Error: {error.message}</span>
        ) : (
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="th">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="td">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default App
