import unittest

from cl1_neural_lab.maze import generate_perfect_maze, neighbors, solve


class MazeTests(unittest.TestCase):
    def test_astar_and_bfs_find_valid_path(self):
        grid = [
            [0, 0, 1, 0],
            [1, 0, 1, 0],
            [0, 0, 0, 0],
        ]
        for algorithm in ("astar", "bfs", "dijkstra", "bidirectional-bfs"):
            result = solve(grid, (0, 0), (2, 3), algorithm=algorithm)
            self.assertTrue(result.found, algorithm)
            self.assertEqual(result.path[0], (0, 0))
            self.assertEqual(result.path[-1], (2, 3))
            self.assertTrue(all(grid[r][c] == 0 for r, c in result.path))

    def test_no_path_and_invalid_endpoints(self):
        grid = [[0, 1, 0], [0, 1, 0], [0, 1, 0]]
        self.assertFalse(solve(grid, (0, 0), (0, 2)).found)
        with self.assertRaises(ValueError):
            solve(grid, (0, 1), (0, 2))
        with self.assertRaises(ValueError):
            solve([], (0, 0), (0, 0))

    def test_diagonal_motion_cannot_cut_corners(self):
        grid = [[0, 1], [1, 0]]
        self.assertEqual(neighbors(grid, (0, 0), diagonal=True), [])
        self.assertFalse(solve(grid, (0, 0), (1, 1), diagonal=True).found)

    def test_generated_maze_is_deterministic_and_connected(self):
        first = generate_perfect_maze(10, 12, seed=17)
        second = generate_perfect_maze(10, 12, seed=17)
        self.assertEqual(first, second)
        self.assertEqual(len(first), 10)
        self.assertEqual(len(first[0]), 12)
        self.assertTrue(solve(first, (0, 0), (9, 11), algorithm="bfs").found)

    def test_invalid_algorithm_rejected(self):
        with self.assertRaises(ValueError):
            solve([[0, 0]], (0, 0), (0, 1), algorithm="teleport")


if __name__ == "__main__":
    unittest.main()
